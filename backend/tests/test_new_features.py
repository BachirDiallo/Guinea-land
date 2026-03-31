"""
Backend API Tests for Guinea Land Hub - New Features
Tests: Feedback, Neighborhood Prices, Reviews, Multi-level Verification
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://guinea-land-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@guinealand.com"
ADMIN_PASSWORD = "admin123"


class TestHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Guinea Land Hub API"
        print("✓ API root endpoint working")
    
    def test_regions_endpoint(self):
        """Test regions endpoint"""
        response = requests.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check Conakry is in regions
        region_names = [r["name"] for r in data]
        assert "Conakry" in region_names
        print(f"✓ Regions endpoint returns {len(data)} regions")
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_lands" in data
        assert "available_lands" in data
        print(f"✓ Stats endpoint working - {data['total_lands']} total lands")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
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
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


class TestFeedbackSystem:
    """Feedback collection system tests"""
    
    def test_get_feedback_list(self):
        """Test GET /api/feedback returns list"""
        response = requests.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Feedback list endpoint returns {len(data)} items")
    
    def test_submit_feedback_suggestion(self):
        """Test POST /api/feedback - submit suggestion"""
        feedback_data = {
            "type": "suggestion",
            "category": "ui",
            "title": "TEST_Améliorer la carte",
            "description": "Il serait utile d'ajouter plus de filtres sur la carte",
            "user_email": "test@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/feedback", json=feedback_data)
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        assert data["type"] == "suggestion"
        assert data["category"] == "ui"
        assert data["status"] == "new"
        print(f"✓ Feedback submitted - ID: {data['feedback_id']}")
        return data["feedback_id"]
    
    def test_submit_feedback_bug(self):
        """Test POST /api/feedback - submit bug report"""
        feedback_data = {
            "type": "bug",
            "category": "map",
            "title": "TEST_Bug sur la carte mobile",
            "description": "La carte ne s'affiche pas correctement sur mobile"
        }
        response = requests.post(f"{BASE_URL}/api/feedback", json=feedback_data)
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "bug"
        assert data["category"] == "map"
        print(f"✓ Bug report submitted - ID: {data['feedback_id']}")
    
    def test_submit_feedback_complaint(self):
        """Test POST /api/feedback - submit complaint"""
        feedback_data = {
            "type": "complaint",
            "category": "transactions",
            "title": "TEST_Réclamation transaction",
            "description": "Problème avec une transaction récente"
        }
        response = requests.post(f"{BASE_URL}/api/feedback", json=feedback_data)
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "complaint"
        print(f"✓ Complaint submitted - ID: {data['feedback_id']}")


class TestNeighborhoodPrices:
    """Neighborhood pricing system tests"""
    
    def test_get_neighborhood_prices(self):
        """Test GET /api/prices/neighborhood"""
        response = requests.get(f"{BASE_URL}/api/prices/neighborhood")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Neighborhood prices endpoint returns {len(data)} records")
    
    def test_get_neighborhood_prices_by_region(self):
        """Test GET /api/prices/neighborhood with region filter"""
        response = requests.get(f"{BASE_URL}/api/prices/neighborhood?region=Conakry")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All results should be for Conakry
        for price in data:
            assert price["region"] == "Conakry"
        print(f"✓ Neighborhood prices for Conakry: {len(data)} records")
    
    def test_get_neighborhood_prices_by_commune(self):
        """Test GET /api/prices/neighborhood with commune filter"""
        response = requests.get(f"{BASE_URL}/api/prices/neighborhood?region=Conakry&commune=Kaloum")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert data[0]["commune"] == "Kaloum"
            print(f"✓ Kaloum price data: {data[0]['price_per_m2_avg']} GNF/m² avg")
        else:
            print("✓ No price data for Kaloum yet")
    
    def test_create_neighborhood_price_requires_auth(self):
        """Test POST /api/prices/neighborhood requires authentication"""
        price_data = {
            "region": "Conakry",
            "commune": "Matam",
            "land_type": "residential",
            "price_per_m2_min": 30000,
            "price_per_m2_max": 60000,
            "price_per_m2_avg": 45000
        }
        response = requests.post(f"{BASE_URL}/api/prices/neighborhood", json=price_data)
        assert response.status_code == 401
        print("✓ Neighborhood price creation requires authentication")
    
    def test_create_neighborhood_price_with_admin(self):
        """Test POST /api/prices/neighborhood with admin auth"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        price_data = {
            "region": "Conakry",
            "commune": "TEST_Matam",
            "land_type": "residential",
            "price_per_m2_min": 35000,
            "price_per_m2_max": 70000,
            "price_per_m2_avg": 52500
        }
        response = requests.post(
            f"{BASE_URL}/api/prices/neighborhood",
            json=price_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "price_id" in data
        assert data["commune"] == "TEST_Matam"
        print(f"✓ Neighborhood price created - ID: {data['price_id']}")


class TestPriceComparison:
    """Price comparison API tests"""
    
    def test_price_comparison_endpoint(self):
        """Test GET /api/prices/compare/{land_id}"""
        # Get a land first
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        if len(lands) > 0:
            land_id = lands[0]["land_id"]
            response = requests.get(f"{BASE_URL}/api/prices/compare/{land_id}")
            assert response.status_code == 200
            data = response.json()
            assert "land_id" in data
            assert "land_price" in data
            assert "land_size" in data
            assert "land_price_per_m2" in data
            assert "reference_available" in data
            print(f"✓ Price comparison for {land_id}: {data['land_price_per_m2']} GNF/m²")
        else:
            pytest.skip("No lands available for testing")
    
    def test_price_comparison_nonexistent_land(self):
        """Test price comparison for non-existent land"""
        response = requests.get(f"{BASE_URL}/api/prices/compare/nonexistent_land_id")
        assert response.status_code == 404
        print("✓ Non-existent land correctly returns 404")


class TestReviewsSystem:
    """Ratings and reviews system tests"""
    
    def test_get_user_reviews(self):
        """Test GET /api/reviews/user/{user_id}"""
        response = requests.get(f"{BASE_URL}/api/reviews/user/user_sample12345")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "reviews" in data
        assert "rating_average" in data
        assert "rating_count" in data
        print(f"✓ User reviews endpoint working - avg rating: {data['rating_average']}")
    
    def test_get_transaction_reviews(self):
        """Test GET /api/reviews/transaction/{transaction_id}"""
        # This should work even for non-existent transaction (returns empty)
        response = requests.get(f"{BASE_URL}/api/reviews/transaction/txn_test123")
        assert response.status_code == 200
        data = response.json()
        assert "transaction_id" in data
        assert "reviews" in data
        print("✓ Transaction reviews endpoint working")
    
    def test_create_review_requires_auth(self):
        """Test POST /api/reviews requires authentication"""
        review_data = {
            "transaction_id": "txn_test123",
            "rating": 5,
            "comment": "Great transaction!"
        }
        response = requests.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response.status_code == 401
        print("✓ Review creation requires authentication")


class TestMultiLevelVerification:
    """Multi-level land verification system tests"""
    
    def test_get_land_verifications(self):
        """Test GET /api/lands/{land_id}/verifications"""
        # Get a land first
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        if len(lands) > 0:
            land_id = lands[0]["land_id"]
            response = requests.get(f"{BASE_URL}/api/lands/{land_id}/verifications")
            assert response.status_code == 200
            data = response.json()
            assert "land_id" in data
            assert "verified" in data
            assert "verifications" in data
            print(f"✓ Land verifications endpoint working - verified: {data['verified']}")
        else:
            pytest.skip("No lands available for testing")
    
    def test_verify_land_requires_admin_role(self):
        """Test POST /api/lands/{land_id}/verify requires admin role"""
        # Get a land first
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        if len(lands) > 0:
            land_id = lands[0]["land_id"]
            # Try without auth
            response = requests.post(f"{BASE_URL}/api/lands/{land_id}/verify")
            assert response.status_code == 401
            print("✓ Land verification requires authentication")
        else:
            pytest.skip("No lands available for testing")
    
    def test_verify_land_with_admin(self):
        """Test POST /api/lands/{land_id}/verify with admin auth"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get an unverified land or any land
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=5")
        lands = lands_response.json()
        
        if len(lands) > 0:
            # Find an unverified land or use first one
            land_id = lands[0]["land_id"]
            for land in lands:
                if not land.get("verified"):
                    land_id = land["land_id"]
                    break
            
            response = requests.post(
                f"{BASE_URL}/api/lands/{land_id}/verify",
                json={"notes": "TEST verification by admin"},
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "verification_level" in data
            print(f"✓ Land verified by admin - level: {data['verification_level']}")
        else:
            pytest.skip("No lands available for testing")


class TestLandsAPI:
    """Lands API tests"""
    
    def test_get_lands_list(self):
        """Test GET /api/lands"""
        response = requests.get(f"{BASE_URL}/api/lands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Lands list returns {len(data)} lands")
    
    def test_get_lands_with_filters(self):
        """Test GET /api/lands with filters"""
        response = requests.get(f"{BASE_URL}/api/lands?region=Conakry&status=available")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify filters applied
        for land in data:
            assert land["region"] == "Conakry"
            assert land["status"] == "available"
        print(f"✓ Filtered lands (Conakry, available): {len(data)} results")
    
    def test_get_single_land(self):
        """Test GET /api/lands/{land_id}"""
        # Get a land first
        lands_response = requests.get(f"{BASE_URL}/api/lands?limit=1")
        lands = lands_response.json()
        if len(lands) > 0:
            land_id = lands[0]["land_id"]
            response = requests.get(f"{BASE_URL}/api/lands/{land_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["land_id"] == land_id
            assert "title" in data
            assert "price" in data
            assert "size" in data
            print(f"✓ Single land retrieved: {data['title']}")
        else:
            pytest.skip("No lands available for testing")
    
    def test_get_nonexistent_land(self):
        """Test GET /api/lands/{land_id} for non-existent land"""
        response = requests.get(f"{BASE_URL}/api/lands/nonexistent_land_id")
        assert response.status_code == 404
        print("✓ Non-existent land correctly returns 404")


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    def test_admin_dashboard_requires_auth(self):
        """Test GET /api/admin/dashboard requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("✓ Admin dashboard requires authentication")
    
    def test_admin_dashboard_with_admin(self):
        """Test GET /api/admin/dashboard with admin auth"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_lands" in data
        assert "pending_verification" in data
        print(f"✓ Admin dashboard: {data['total_lands']} lands, {data['pending_verification']} pending")
    
    def test_admin_feedback_stats(self):
        """Test GET /api/admin/feedback-stats with admin auth"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/feedback-stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_type" in data
        assert "by_status" in data
        print(f"✓ Feedback stats: {data['total']} total feedback items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
