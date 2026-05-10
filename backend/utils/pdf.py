"""PDF generation utilities"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import qrcode
from config import FRONTEND_URL

def generate_transaction_pdf(transaction_data: dict, land_data: dict, buyer_data: dict, seller_data: dict) -> BytesIO:
    """Generate a PDF receipt for a transaction"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#133E26'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#D95A2B'),
        spaceBefore=20,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("GUINEA LAND HUB", title_style))
    elements.append(Paragraph("Certificat de Transaction Foncière", subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Transaction reference
    ref_style = ParagraphStyle(
        'Reference',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#133E26'),
        alignment=TA_CENTER,
        spaceAfter=30
    )
    elements.append(Paragraph(f"Référence: {transaction_data['transaction_id']}", ref_style))
    
    # Land details section
    elements.append(Paragraph("Détails du Terrain", section_style))
    
    land_info = [
        ["Titre:", land_data.get('title', 'N/A')],
        ["Localisation:", f"{land_data.get('commune', '')}, {land_data.get('region', '')}"],
        ["Adresse:", land_data.get('address', 'N/A')],
        ["Surface:", f"{land_data.get('size', 0):,.0f} m²"],
        ["Type:", land_data.get('land_type', 'N/A')]
    ]
    
    land_table = Table(land_info, colWidths=[4*cm, 12*cm])
    land_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(land_table)
    
    # Parties section
    elements.append(Paragraph("Parties Impliquées", section_style))
    
    parties_info = [
        ["VENDEUR", "ACHETEUR"],
        [seller_data.get('name', 'N/A') if seller_data else 'N/A', buyer_data.get('name', 'N/A')],
        [seller_data.get('email', '') if seller_data else '', buyer_data.get('email', '')],
        [seller_data.get('phone', '') if seller_data else '', buyer_data.get('phone', '')]
    ]
    
    parties_table = Table(parties_info, colWidths=[8*cm, 8*cm])
    parties_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#133E26')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#D95A2B')),
    ]))
    elements.append(parties_table)
    
    # Transaction details section
    elements.append(Paragraph("Détails de la Transaction", section_style))
    
    transaction_info = [
        ["Date:", transaction_data.get('created_at', 'N/A')[:10]],
        ["Statut:", transaction_data.get('status', 'pending').upper()],
        ["Notes:", transaction_data.get('notes', '-') or '-']
    ]
    
    trans_table = Table(transaction_info, colWidths=[4*cm, 12*cm])
    trans_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(trans_table)
    
    # Price box
    elements.append(Spacer(1, 20))
    
    price_style = ParagraphStyle(
        'Price',
        parent=styles['Normal'],
        fontSize=20,
        textColor=colors.HexColor('#D95A2B'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    elements.append(Paragraph(f"Prix: {transaction_data.get('price', 0):,.0f} GNF", price_style))
    
    # QR Code
    elements.append(Spacer(1, 30))
    
    qr_url = f"{FRONTEND_URL}/transactions/{transaction_data['transaction_id']}"
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(qr_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#133E26", back_color="white")
    
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    qr_image = Image(qr_buffer, width=3*cm, height=3*cm)
    
    qr_table = Table([[qr_image]], colWidths=[16*cm])
    qr_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(qr_table)
    
    qr_caption = ParagraphStyle(
        'QRCaption',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        spaceBefore=5
    )
    elements.append(Paragraph("Scannez pour vérifier cette transaction", qr_caption))
    
    # Footer
    elements.append(Spacer(1, 40))
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#999999'),
        alignment=TA_CENTER
    )
    elements.append(Paragraph("Ce document est généré automatiquement par Guinea Land Hub.", footer_style))
    elements.append(Paragraph("Pour toute question, contactez-nous sur notre plateforme.", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
