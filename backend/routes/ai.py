"""AI routes - Chat assistant and description generator"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import uuid
import logging

from database import db
from models.common import AIMessageRequest, AIMessageResponse, AIDescriptionRequest, AIDescriptionResponse
from config import EMERGENT_KEY

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])

# ==================== AI ASSISTANT ====================

AI_SYSTEM_PROMPT = """Tu es l'Assistant Terrain IA de Guinea Land Hub, un expert bilingue (français/anglais) spécialisé dans les transactions foncières en Guinée.

RÔLE ET EXPERTISE:
- Expert en immobilier et transactions foncières en Guinée
- Connaissance approfondie des régions: Conakry, Kindia, Boké, Mamou, Labé, Faranah, Kankan, N'Zérékoré
- Compréhension des aspects légaux des transactions foncières guinéennes
- Conseil sur les prix du marché, les types de terrains (résidentiel, commercial, agricole)

FONCTIONNALITÉS DE LA PLATEFORME À PROMOUVOIR:
- Carte interactive pour explorer les terrains
- Système de confiance et vérification
- Comparaison de terrains (jusqu'à 4)
- Alertes de zone personnalisées
- Historique des transactions
- Documents et photos sécurisés

RÈGLES:
1. Réponds TOUJOURS dans la langue de l'utilisateur (français par défaut, anglais si détecté)
2. Sois concis mais informatif (max 150 mots)
3. Si on te demande de chercher un terrain, guide l'utilisateur vers la page /listings ou /map
4. Pour des questions légales complexes, recommande de consulter un notaire
5. Mentionne les fonctionnalités pertinentes de la plateforme quand c'est approprié

EXEMPLES DE QUESTIONS:
- "Je cherche un terrain à Conakry" → Guide vers /listings avec filtres
- "Quel est le prix moyen?" → Donne une fourchette et suggère /market-trends
- "Comment vendre mon terrain?" → Explique le processus et guide vers /lands/new
- "Est-ce sécurisé?" → Explique le système de confiance et vérification

You are the AI Land Assistant of Guinea Land Hub. Respond helpfully to questions about land transactions in Guinea."""

@router.post("/chat", response_model=AIMessageResponse)
async def ai_chat_endpoint(request: AIMessageRequest):
    """AI Land Assistant chat endpoint"""
    try:
        session_id = request.session_id
        
        # Initialize LlmChat
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=AI_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o-mini")
        
        # Load conversation history
        history = await db.ai_chat_history.find_one({"session_id": session_id})
        
        if history and "messages" in history:
            for msg in history["messages"]:
                if msg["role"] == "user":
                    chat.conversation_history.append({"role": "user", "content": msg["content"]})
                else:
                    chat.conversation_history.append({"role": "assistant", "content": msg["content"]})
        
        # Send message
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save to history
        new_messages = [
            {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
            {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
        ]
        
        await db.ai_chat_history.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": {"$each": new_messages}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return AIMessageResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        fallback = {
            "fr": "Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants ou explorer notre carte interactive pour trouver des terrains.",
            "en": "Sorry, I'm experiencing technical difficulties. Please try again in a moment or explore our interactive map to find lands."
        }
        return AIMessageResponse(
            response=fallback.get(request.language, fallback["fr"]),
            session_id=request.session_id
        )

@router.get("/history/{session_id}")
async def get_ai_chat_history(session_id: str):
    """Get chat history for a session"""
    history = await db.ai_chat_history.find_one({"session_id": session_id}, {"_id": 0})
    return history or {"session_id": session_id, "messages": []}

@router.delete("/history/{session_id}")
async def clear_ai_chat_history(session_id: str):
    """Clear chat history"""
    await db.ai_chat_history.delete_one({"session_id": session_id})
    return {"success": True, "message": "Chat history cleared"}

# ==================== AI DESCRIPTION GENERATOR ====================

AI_DESCRIPTION_PROMPT = """Tu es un expert en rédaction d'annonces immobilières pour le marché guinéen. 
Tu dois créer des descriptions de terrains attrayantes, professionnelles et convaincantes en français.

RÈGLES:
1. Écris UNIQUEMENT la description, sans titre ni introduction
2. Utilise un ton professionnel mais chaleureux
3. Mets en valeur les points forts du terrain
4. Mentionne la localisation de manière attractive
5. Adapte le style au type de terrain (résidentiel, commercial, agricole)
6. Longueur: 80-120 mots
7. Utilise des paragraphes courts et aérés
8. Évite les clichés et le jargon technique excessif
9. N'invente PAS d'informations non fournies

STYLES PAR TYPE:
- Résidentiel: Accent sur le cadre de vie, la tranquillité, le potentiel familial
- Commercial: Accent sur la visibilité, l'accessibilité, le potentiel économique
- Agricole: Accent sur la fertilité, l'irrigation, le potentiel de rendement"""

@router.post("/generate-description", response_model=AIDescriptionResponse)
async def generate_land_description(request: AIDescriptionRequest):
    """Generate AI-powered land description"""
    try:
        land_type_fr = {
            "residential": "résidentiel",
            "commercial": "commercial",
            "agricultural": "agricole"
        }.get(request.land_type, "résidentiel")
        
        user_prompt = f"""Génère une description attractive pour ce terrain:

- Type: {land_type_fr}
- Surface: {request.size:,.0f} m²
- Région: {request.region}
- Commune: {request.commune}
{f'- Adresse: {request.address}' if request.address else ''}
{f'- Titre suggéré: {request.title}' if request.title else ''}
{f'- Prix: {request.price:,.0f} GNF' if request.price > 0 else ''}

Écris une description de 80-120 mots qui donnera envie aux acheteurs potentiels."""

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"desc_gen_{uuid.uuid4().hex[:8]}",
            system_message=AI_DESCRIPTION_PROMPT
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=user_prompt)
        description = await chat.send_message(user_message)
        description = description.strip().strip('"').strip("'")
        
        return AIDescriptionResponse(description=description, success=True)
        
    except Exception as e:
        logger.error(f"AI Description error: {e}")
        fallback = f"Superbe terrain {request.land_type} de {request.size:,.0f} m² situé à {request.commune}, {request.region}. Cette parcelle offre un excellent potentiel pour votre projet. Emplacement stratégique avec bon accès. Contactez-nous pour plus d'informations et organiser une visite."
        return AIDescriptionResponse(description=fallback, success=False)
