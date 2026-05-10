"""Email utilities using Resend"""
import logging
import resend
from config import RESEND_API_KEY, SENDER_EMAIL, FRONTEND_URL

logger = logging.getLogger(__name__)

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

async def send_transaction_email(
    recipient_email: str,
    recipient_name: str,
    transaction_type: str,
    transaction_data: dict,
    land_data: dict
):
    """Send transaction notification email"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - email notifications disabled")
        return None
    
    subject = f"Guinea Land Hub - Confirmation de Transaction #{transaction_data['transaction_id'][-8:]}"
    
    if transaction_type == "buyer":
        intro = f"Félicitations {recipient_name}! Votre achat de terrain a été enregistré avec succès."
    else:
        intro = f"Bonjour {recipient_name}, la vente de votre terrain a été enregistrée avec succès."
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'IBM Plex Sans', Arial, sans-serif; background-color: #F7F7F5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #133E26; }}
            .header {{ background-color: #133E26; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; }}
            .intro {{ font-size: 16px; margin-bottom: 20px; }}
            .details {{ background-color: #F7F7F5; padding: 20px; margin: 20px 0; }}
            .details h3 {{ margin-top: 0; color: #133E26; border-bottom: 2px solid #D95A2B; padding-bottom: 10px; }}
            .row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }}
            .label {{ color: #666; }}
            .value {{ font-weight: bold; }}
            .price {{ font-size: 24px; color: #D95A2B; text-align: center; margin: 20px 0; }}
            .footer {{ background-color: #133E26; color: white; padding: 20px; text-align: center; font-size: 12px; }}
            .cta {{ display: inline-block; background-color: #D95A2B; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>GUINEA LAND HUB</h1>
                <p>Confirmation de Transaction</p>
            </div>
            <div class="content">
                <p class="intro">{intro}</p>
                
                <div class="details">
                    <h3>Détails du Terrain</h3>
                    <div class="row"><span class="label">Titre:</span><span class="value">{land_data.get('title', 'N/A')}</span></div>
                    <div class="row"><span class="label">Localisation:</span><span class="value">{land_data.get('commune', '')}, {land_data.get('region', '')}</span></div>
                    <div class="row"><span class="label">Surface:</span><span class="value">{land_data.get('size', 0):,.0f} m²</span></div>
                    <div class="row"><span class="label">Type:</span><span class="value">{land_data.get('land_type', 'N/A')}</span></div>
                </div>
                
                <div class="price">
                    Prix: {transaction_data.get('price', 0):,.0f} GNF
                </div>
                
                <div class="details">
                    <h3>Détails de la Transaction</h3>
                    <div class="row"><span class="label">Référence:</span><span class="value">{transaction_data['transaction_id']}</span></div>
                    <div class="row"><span class="label">Date:</span><span class="value">{transaction_data.get('created_at', 'N/A')[:10]}</span></div>
                    <div class="row"><span class="label">Statut:</span><span class="value">{transaction_data.get('status', 'pending').upper()}</span></div>
                </div>
                
                <center>
                    <a href="{FRONTEND_URL}/transactions" class="cta">Voir mes transactions</a>
                </center>
            </div>
            <div class="footer">
                <p>Guinea Land Hub - Transactions foncières sécurisées en Guinée</p>
                <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }
        email_response = resend.Emails.send(params)
        logger.info(f"Transaction email sent to {recipient_email}")
        return email_response
    except Exception as e:
        logger.error(f"Failed to send transaction email: {e}")
        return None

async def send_zone_alert_email(email: str, name: str, land: dict, land_url: str):
    """Send zone alert notification email"""
    if not RESEND_API_KEY:
        return None
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'IBM Plex Sans', Arial, sans-serif; background-color: #F7F7F5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #133E26; }}
            .header {{ background-color: #133E26; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .land-card {{ border: 1px solid #ddd; padding: 15px; margin: 15px 0; }}
            .price {{ color: #D95A2B; font-size: 20px; font-weight: bold; }}
            .cta {{ display: inline-block; background-color: #D95A2B; color: white; padding: 12px 24px; text-decoration: none; }}
            .footer {{ background-color: #F7F7F5; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Nouvelle annonce dans votre zone!</h2>
            </div>
            <div class="content">
                <p>Bonjour {name},</p>
                <p>Un nouveau terrain correspondant à vos critères vient d'être publié:</p>
                
                <div class="land-card">
                    <h3>{land.get('title', 'Terrain')}</h3>
                    <p>{land.get('commune', '')}, {land.get('region', '')}</p>
                    <p>Surface: {land.get('size', 0):,.0f} m²</p>
                    <p class="price">{land.get('price', 0):,.0f} GNF</p>
                </div>
                
                <center>
                    <a href="{land_url}" class="cta">Voir le terrain</a>
                </center>
            </div>
            <div class="footer">
                <p>Vous recevez cet email car vous avez activé les alertes de zone sur Guinea Land Hub.</p>
                <p><a href="{FRONTEND_URL}/zone-alerts">Gérer mes alertes</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": f"Nouveau terrain à {land.get('commune', 'votre zone')} - Guinea Land Hub",
            "html": html_content
        }
        resend.Emails.send(params)
        logger.info(f"Zone alert email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send zone alert email: {e}")
        return False
