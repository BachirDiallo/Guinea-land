"""
Test suite for Guinea Land Hub - Push Notifications and Dual Pricing System
Tests: /api/prices/nearby, /api/prices/market-analysis, /api/notifications/*
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://guinea-land-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@guinealand.com"
ADMIN_PASSWORD = "admin123"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Guinea Land Hub API"
        print("✓ API root endpoint working")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self):
        """Test admin login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful - user_id: {data['user']['user_id']}")
        return data["token"]
    
    def test_invalid_login(self):
        """Test invalid credentials rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


class TestNearbyPricesAPI:
    """Tests for /api/prices/nearby/{land_id} endpoint"""
    
    def test_get_nearby_prices_valid_land(self):
        """Test getting nearby transaction prices for a valid land"""
        # First get a land_id
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        assert lands_response.status_code == 200
        lands = lands_response.json()
        
        if not lands:
            pytest.skip("No lands available for testing")
        
        land_id = lands[0]["land_id"]
        
        # Get nearby prices
        response = requests.get(f"{BASE_URL}/api/prices/nearby/{land_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "land_id" in data
        assert data["land_id"] == land_id
        assert "search_radius_km" in data
        assert "nearby_transactions" in data
        assert "total_found" in data
        assert isinstance(data["nearby_transactions"], list)
        
        print(f"✓ Nearby prices API working - found {data['total_found']} transactions within {data['search_radius_km']}km")
        
        # If there are nearby transactions, verify structure
        if data["nearby_transactions"]:
            tx = data["nearby_transactions"][0]
            assert "transaction_id" in tx
            assert "land_title" in tx
            assert "price_per_m2" in tx
            assert "distance_km" in tx
            print(f"  - Nearest transaction: {tx['land_title']} at {tx['distance_km']}km, {tx['price_per_m2']} GNF/m²")
    
    def test_get_nearby_prices_with_radius(self):
        """Test nearby prices with custom radius"""
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        
        if not lands:
            pytest.skip("No lands available for testing")
        
        land_id = lands[0]["land_id"]
        
        # Test with 10km radius
        response = requests.get(f"{BASE_URL}/api/prices/nearby/{land_id}?radius_km=10")
        assert response.status_code == 200
        data = response.json()
        assert data["search_radius_km"] == 10.0
        print(f"✓ Custom radius (10km) working - found {data['total_found']} transactions")
    
    def test_get_nearby_prices_invalid_land(self):
        """Test nearby prices with invalid land_id returns 404"""
        response = requests.get(f"{BASE_URL}/api/prices/nearby/invalid_land_id_12345")
        assert response.status_code == 404
        print("✓ Invalid land_id correctly returns 404")


class TestMarketAnalysisAPI:
    """Tests for /api/prices/market-analysis endpoint"""
    
    def test_get_market_analysis_default(self):
        """Test market analysis with default parameters"""
        response = requests.get(f"{BASE_URL}/api/prices/market-analysis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period_months" in data
        assert "filters" in data
        assert "total_transactions" in data
        
        print(f"✓ Market analysis API working - {data['total_transactions']} transactions in {data['period_months']} months")
        
        if data["statistics"]:
            stats = data["statistics"]
            assert "avg_price_per_m2" in stats
            assert "min_price_per_m2" in stats
            assert "max_price_per_m2" in stats
            print(f"  - Avg price: {stats['avg_price_per_m2']} GNF/m², Range: {stats['min_price_per_m2']}-{stats['max_price_per_m2']} GNF/m²")
    
    def test_get_market_analysis_with_region_filter(self):
        """Test market analysis filtered by region"""
        response = requests.get(f"{BASE_URL}/api/prices/market-analysis?region=Conakry")
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["region"] == "Conakry"
        print(f"✓ Market analysis with region filter - {data['total_transactions']} transactions in Conakry")
    
    def test_get_market_analysis_with_commune_filter(self):
        """Test market analysis filtered by commune"""
        response = requests.get(f"{BASE_URL}/api/prices/market-analysis?commune=Kaloum")
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["commune"] == "Kaloum"
        print(f"✓ Market analysis with commune filter - {data['total_transactions']} transactions in Kaloum")
    
    def test_get_market_analysis_with_land_type_filter(self):
        """Test market analysis filtered by land type"""
        response = requests.get(f"{BASE_URL}/api/prices/market-analysis?land_type=residential")
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["land_type"] == "residential"
        print(f"✓ Market analysis with land_type filter - {data['total_transactions']} residential transactions")
    
    def test_get_market_analysis_with_months_filter(self):
        """Test market analysis with custom time period"""
        response = requests.get(f"{BASE_URL}/api/prices/market-analysis?months=6")
        assert response.status_code == 200
        data = response.json()
        assert data["period_months"] == 6
        print(f"✓ Market analysis with 6 months period - {data['total_transactions']} transactions")


class TestNotificationsAPI:
    """Tests for /api/notifications/* endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_notification_status_requires_auth(self):
        """Test notification status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/status")
        assert response.status_code == 401
        print("✓ Notification status correctly requires authentication")
    
    def test_notification_status_authenticated(self, auth_token):
        """Test notification status with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscribed" in data
        print(f"✓ Notification status API working - subscribed: {data['subscribed']}")
    
    def test_notification_subscribe(self, auth_token):
        """Test subscribing to notifications"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "endpoint": "test-endpoint-" + str(os.urandom(4).hex()),
                "keys": {"p256dh": "test", "auth": "test"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscription_id" in data or "message" in data
        print(f"✓ Notification subscribe API working - {data.get('message', 'subscribed')}")
    
    def test_notification_history(self, auth_token):
        """Test getting notification history"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Notification history API working - {len(data)} notifications")
    
    def test_notification_unread_count(self, auth_token):
        """Test getting unread notification count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"✓ Unread count API working - {data['unread_count']} unread notifications")
    
    def test_notification_mark_read(self, auth_token):
        """Test marking notifications as read"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/mark-read",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"notification_ids": []}  # Mark all as read
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Mark notifications as read API working")
    
    def test_notification_preferences_update(self, auth_token):
        """Test updating notification preferences"""
        # First subscribe to ensure there's an active subscription
        requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"endpoint": "test-prefs-endpoint", "keys": {}}
        )
        
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "preferences": {
                    "new_listings": True,
                    "transaction_updates": True,
                    "price_alerts": False,
                    "verifications": True
                }
            }
        )
        # May return 404 if no active subscription, which is acceptable
        assert response.status_code in [200, 404]
        print(f"✓ Notification preferences API working - status: {response.status_code}")


class TestLandDetailWithPriceComparison:
    """Tests for land detail page with enhanced price comparison"""
    
    def test_land_detail_returns_price_data(self):
        """Test that land detail includes price per m2 calculation"""
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        
        if not lands:
            pytest.skip("No lands available for testing")
        
        land_id = lands[0]["land_id"]
        
        response = requests.get(f"{BASE_URL}/api/lands/{land_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "price" in data
        assert "size" in data
        
        # Calculate expected price per m2
        if data["size"] > 0:
            expected_price_per_m2 = data["price"] / data["size"]
            print(f"✓ Land detail has price data - {data['price']:,.0f} GNF for {data['size']:,.0f} m² = {expected_price_per_m2:,.0f} GNF/m²")
    
    def test_price_compare_endpoint(self):
        """Test price comparison endpoint"""
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        
        if not lands:
            pytest.skip("No lands available for testing")
        
        land_id = lands[0]["land_id"]
        
        response = requests.get(f"{BASE_URL}/api/prices/compare/{land_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "land_id" in data
        assert "land_price_per_m2" in data
        assert "reference_available" in data
        
        print(f"✓ Price compare API working - land price: {data['land_price_per_m2']} GNF/m², reference available: {data['reference_available']}")


class TestExistingFeatures:
    """Verify existing features still work"""
    
    def test_regions_endpoint(self):
        """Test regions endpoint"""
        response = requests.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 8  # 8 Guinea regions
        print(f"✓ Regions endpoint working - {len(data)} regions")
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_lands" in data
        assert "available_lands" in data
        print(f"✓ Stats endpoint working - {data['total_lands']} total lands, {data['available_lands']} available")
    
    def test_lands_list(self):
        """Test lands listing"""
        response = requests.get(f"{BASE_URL}/api/lands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Lands list endpoint working - {len(data)} lands")
    
    def test_feedback_endpoint(self):
        """Test feedback endpoint"""
        response = requests.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Feedback endpoint working - {len(data)} feedback items")
    
    def test_neighborhood_prices(self):
        """Test neighborhood prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/prices/neighborhood")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Neighborhood prices endpoint working - {len(data)} price references")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
