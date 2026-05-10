"""SMS utilities using Twilio"""
import logging
from twilio.rest import Client as TwilioClient
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

logger = logging.getLogger(__name__)

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

async def send_sms_notification(phone: str, message: str) -> bool:
    """Send SMS notification via Twilio"""
    if not twilio_client or not TWILIO_PHONE_NUMBER:
        logger.warning("Twilio not configured - SMS notifications disabled")
        return False
    
    try:
        # Format phone for Guinea (+224)
        if not phone.startswith('+'):
            if phone.startswith('224'):
                phone = '+' + phone
            else:
                phone = '+224' + phone.lstrip('0')
        
        # Truncate message if too long
        if len(message) > 160:
            message = message[:157] + "..."
        
        twilio_message = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        
        logger.info(f"SMS sent to {phone}: {twilio_message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone}: {e}")
        return False

def get_sms_status() -> dict:
    """Get SMS configuration status"""
    return {
        "configured": bool(twilio_client and TWILIO_PHONE_NUMBER),
        "account_sid": TWILIO_ACCOUNT_SID[:8] + "..." if TWILIO_ACCOUNT_SID else None,
        "phone_number": TWILIO_PHONE_NUMBER
    }
