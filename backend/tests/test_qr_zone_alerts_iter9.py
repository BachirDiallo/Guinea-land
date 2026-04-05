"""
Test file for Guinea Land Hub - Iteration 9
Testing: QR Code generation, Zone Alerts CRUD, SMS status endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://guinea-land-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "buyer2@test.com"
TEST_USER_PASSWORD = "test123"
ADMIN_EMAIL = "admin@guinealand.com"
ADMIN_PASSWORD = "admin123"
SAMPLE_LAND_ID = "land_e48b96e18252"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Guinea Land Hub" in data["message"]
        print("✓ API root endpoint working")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_buyer2(self):
        """Test login with buyer2@test.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ Login successful for {TEST_USER_EMAIL}")
        return data["token"]
    
    def test_login_admin(self):
        """Test login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful")
        return data["token"]


class TestQRCodeGeneration:
    """QR Code generation endpoint tests"""
    
    def test_qrcode_endpoint_returns_png(self):
        """Test GET /api/lands/{land_id}/qrcode returns PNG image"""
        response = requests.get(f"{BASE_URL}/api/lands/{SAMPLE_LAND_ID}/qrcode")
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == "image/png"
        # Check it's a valid PNG (starts with PNG signature)
        assert response.content[:8] == b'\x89PNG\r\n\x1a\n'
        print(f"✓ QR code endpoint returns valid PNG for {SAMPLE_LAND_ID}")
    
    def test_qrcode_with_custom_size(self):
        """Test QR code with custom size parameter"""
        response = requests.get(f"{BASE_URL}/api/lands/{SAMPLE_LAND_ID}/qrcode?size=128")
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == "image/png"
        print("✓ QR code with custom size works")
    
    def test_qrcode_invalid_land_returns_404(self):
        """Test QR code for non-existent land returns 404"""
        response = requests.get(f"{BASE_URL}/api/lands/invalid_land_id/qrcode")
        assert response.status_code == 404
        print("✓ QR code for invalid land returns 404")
    
    def test_qrcode_download_endpoint(self):
        """Test GET /api/lands/{land_id}/qrcode/download returns printable PNG"""
        response = requests.get(f"{BASE_URL}/api/lands/{SAMPLE_LAND_ID}/qrcode/download")
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == "image/png"
        # Check Content-Disposition header for attachment
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert "terrain_qr_" in content_disp
        print("✓ QR code download endpoint returns attachment PNG")
    
    def test_qrcode_download_with_info(self):
        """Test QR code download with land info included"""
        response = requests.get(f"{BASE_URL}/api/lands/{SAMPLE_LAND_ID}/qrcode/download?include_info=true")
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == "image/png"
        # Image with info should be larger than basic QR
        assert len(response.content) > 1000  # Should be a reasonable size
        print("✓ QR code download with info works")
    
    def test_qrcode_download_without_info(self):
        """Test QR code download without land info"""
        response = requests.get(f"{BASE_URL}/api/lands/{SAMPLE_LAND_ID}/qrcode/download?include_info=false")
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == "image/png"
        print("✓ QR code download without info works")


class TestZoneAlertsCRUD:
    """Zone Alerts CRUD operations tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_create_zone_alert(self, auth_session):
        """Test POST /api/zone-alerts creates alert"""
        alert_data = {
            "region": "Conakry",
            "commune": "Ratoma",
            "quartier": "Nongo",
            "land_types": ["residential", "commercial"],
            "max_price": 500000000,
            "min_size": 500,
            "notify_email": True,
            "notify_sms": False
        }
        response = auth_session.post(f"{BASE_URL}/api/zone-alerts", json=alert_data)
        assert response.status_code == 200
        data = response.json()
        assert "alert_id" in data
        assert data["region"] == "Conakry"
        assert data["commune"] == "Ratoma"
        assert data["is_active"] == True
        print(f"✓ Zone alert created: {data['alert_id']}")
        return data["alert_id"]
    
    def test_get_zone_alerts(self, auth_session):
        """Test GET /api/zone-alerts lists user alerts"""
        response = auth_session.get(f"{BASE_URL}/api/zone-alerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET zone alerts returned {len(data)} alerts")
        return data
    
    def test_update_zone_alert(self, auth_session):
        """Test PUT /api/zone-alerts/{id} updates alert"""
        # First create an alert
        alert_data = {
            "region": "Kindia",
            "commune": "",
            "land_types": ["agricultural"],
            "notify_email": True,
            "notify_sms": False
        }
        create_response = auth_session.post(f"{BASE_URL}/api/zone-alerts", json=alert_data)
        assert create_response.status_code == 200
        alert_id = create_response.json()["alert_id"]
        
        # Update the alert
        update_data = {
            "is_active": False,
            "max_price": 100000000
        }
        update_response = auth_session.put(f"{BASE_URL}/api/zone-alerts/{alert_id}", json=update_data)
        assert update_response.status_code == 200
        assert "message" in update_response.json()
        print(f"✓ Zone alert {alert_id} updated")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/zone-alerts/{alert_id}")
        return alert_id
    
    def test_delete_zone_alert(self, auth_session):
        """Test DELETE /api/zone-alerts/{id} deletes alert"""
        # First create an alert
        alert_data = {
            "region": "Labé",
            "land_types": ["residential"],
            "notify_email": True,
            "notify_sms": False
        }
        create_response = auth_session.post(f"{BASE_URL}/api/zone-alerts", json=alert_data)
        assert create_response.status_code == 200
        alert_id = create_response.json()["alert_id"]
        
        # Delete the alert
        delete_response = auth_session.delete(f"{BASE_URL}/api/zone-alerts/{alert_id}")
        assert delete_response.status_code == 200
        assert "message" in delete_response.json()
        print(f"✓ Zone alert {alert_id} deleted")
        
        # Verify deletion
        alerts = auth_session.get(f"{BASE_URL}/api/zone-alerts").json()
        alert_ids = [a["alert_id"] for a in alerts]
        assert alert_id not in alert_ids
        print("✓ Verified alert was deleted")
    
    def test_zone_alert_requires_auth(self):
        """Test zone alerts require authentication"""
        # Without auth
        response = requests.get(f"{BASE_URL}/api/zone-alerts")
        assert response.status_code == 401
        print("✓ Zone alerts require authentication")
    
    def test_zone_alert_create_requires_region(self, auth_session):
        """Test zone alert creation requires region"""
        alert_data = {
            "commune": "Ratoma",
            "land_types": ["residential"]
        }
        response = auth_session.post(f"{BASE_URL}/api/zone-alerts", json=alert_data)
        # Should fail validation
        assert response.status_code in [400, 422]
        print("✓ Zone alert creation requires region field")


class TestSMSStatus:
    """SMS status endpoint tests"""
    
    def test_sms_status_endpoint(self):
        """Test GET /api/sms/status returns configured status"""
        response = requests.get(f"{BASE_URL}/api/sms/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        assert isinstance(data["configured"], bool)
        # Since Twilio is not configured, should be False
        assert data["configured"] == False
        print(f"✓ SMS status endpoint works, configured: {data['configured']}")


class TestLandExists:
    """Verify sample land exists for testing"""
    
    def test_sample_land_exists(self):
        """Verify the sample land ID exists"""
        response = requests.get(f"{BASE_URL}/api/lands/{SAMPLE_LAND_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["land_id"] == SAMPLE_LAND_ID
        print(f"✓ Sample land exists: {data['title']}")


# Cleanup fixture to remove test alerts after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_alerts():
    """Cleanup test alerts after all tests"""
    yield
    # Cleanup after tests
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        alerts = session.get(f"{BASE_URL}/api/zone-alerts").json()
        for alert in alerts:
            # Delete test alerts (those created in Kindia, Labé, or with specific test patterns)
            if alert.get("region") in ["Kindia", "Labé"] or alert.get("quartier") == "Nongo":
                session.delete(f"{BASE_URL}/api/zone-alerts/{alert['alert_id']}")
        print("✓ Test alerts cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
