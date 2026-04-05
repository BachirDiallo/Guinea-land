"""
Test file for Guinea Land Hub - Iteration 8
Testing: Market Trends, Land Comparison, Saved Searches, and Local Language Support
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous iteration
ADMIN_EMAIL = "admin@guinealand.com"
ADMIN_PASSWORD = "admin123"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API root: {data}")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self):
        """Test admin login with known credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"Admin login successful: {data['user']['name']}")
        return data["token"]
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid login correctly rejected")


class TestMarketTrends:
    """Market Trends API tests - GET /api/market/trends"""
    
    def test_market_trends_default(self):
        """Test market trends with default parameters"""
        response = requests.get(f"{BASE_URL}/api/market/trends")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period_months" in data
        assert "filters" in data
        assert "trends" in data
        assert "summary" in data
        
        # Verify summary structure
        assert "total_transactions" in data["summary"]
        assert "total_volume" in data["summary"]
        assert "trend_direction" in data["summary"]
        assert "change_percent" in data["summary"]
        
        print(f"Market trends: {data['summary']['total_transactions']} transactions, direction: {data['summary']['trend_direction']}")
    
    def test_market_trends_with_region_filter(self):
        """Test market trends filtered by region"""
        response = requests.get(f"{BASE_URL}/api/market/trends?region=Conakry")
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["region"] == "Conakry"
        print(f"Market trends for Conakry: {data['summary']['total_transactions']} transactions")
    
    def test_market_trends_with_land_type_filter(self):
        """Test market trends filtered by land type"""
        response = requests.get(f"{BASE_URL}/api/market/trends?land_type=residential")
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["land_type"] == "residential"
        print(f"Market trends for residential: {data['summary']['total_transactions']} transactions")
    
    def test_market_trends_with_months_filter(self):
        """Test market trends with custom months period"""
        response = requests.get(f"{BASE_URL}/api/market/trends?months=6")
        assert response.status_code == 200
        data = response.json()
        assert data["period_months"] == 6
        print(f"Market trends for 6 months: {data['summary']['total_transactions']} transactions")
    
    def test_market_trends_combined_filters(self):
        """Test market trends with multiple filters"""
        response = requests.get(f"{BASE_URL}/api/market/trends?region=Conakry&land_type=residential&months=12")
        assert response.status_code == 200
        data = response.json()
        assert data["filters"]["region"] == "Conakry"
        assert data["filters"]["land_type"] == "residential"
        assert data["period_months"] == 12
        print(f"Combined filters: {data['summary']['total_transactions']} transactions")


class TestLandComparison:
    """Land Comparison API tests - POST /api/compare"""
    
    @pytest.fixture
    def land_ids(self):
        """Get available land IDs for comparison"""
        response = requests.get(f"{BASE_URL}/api/lands?status=available&limit=5")
        assert response.status_code == 200
        lands = response.json()
        return [land["land_id"] for land in lands[:3]] if len(lands) >= 2 else []
    
    def test_compare_lands_success(self, land_ids):
        """Test comparing multiple lands"""
        if len(land_ids) < 2:
            pytest.skip("Not enough lands available for comparison")
        
        response = requests.post(f"{BASE_URL}/api/compare", json={
            "land_ids": land_ids[:2]
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "lands" in data
        assert "metrics" in data
        assert "best_value" in data
        
        # Verify metrics structure
        assert "price" in data["metrics"]
        assert "size" in data["metrics"]
        assert "price_per_m2" in data["metrics"]
        
        # Verify best_value structure
        assert "cheapest" in data["best_value"]
        assert "largest" in data["best_value"]
        assert "best_price_per_m2" in data["best_value"]
        
        print(f"Compared {len(data['lands'])} lands")
        print(f"Best value - Cheapest: {data['best_value']['cheapest']}")
    
    def test_compare_lands_with_three(self, land_ids):
        """Test comparing three lands"""
        if len(land_ids) < 3:
            pytest.skip("Not enough lands available for comparison")
        
        response = requests.post(f"{BASE_URL}/api/compare", json={
            "land_ids": land_ids[:3]
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["lands"]) == 3
        print(f"Compared 3 lands successfully")
    
    def test_compare_lands_minimum_required(self):
        """Test that at least 2 lands are required"""
        response = requests.post(f"{BASE_URL}/api/compare", json={
            "land_ids": ["land_single"]
        })
        assert response.status_code == 400
        print("Correctly rejected single land comparison")
    
    def test_compare_lands_maximum_limit(self):
        """Test that maximum 5 lands are allowed"""
        response = requests.post(f"{BASE_URL}/api/compare", json={
            "land_ids": ["land_1", "land_2", "land_3", "land_4", "land_5", "land_6"]
        })
        assert response.status_code == 400
        print("Correctly rejected more than 5 lands")
    
    def test_compare_lands_invalid_ids(self):
        """Test comparison with invalid land IDs"""
        response = requests.post(f"{BASE_URL}/api/compare", json={
            "land_ids": ["invalid_1", "invalid_2"]
        })
        assert response.status_code == 400
        print("Correctly rejected invalid land IDs")


class TestSavedSearches:
    """Saved Searches API tests - requires authentication"""
    
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
    
    def test_save_search(self, auth_token):
        """Test saving a search filter"""
        response = requests.post(
            f"{BASE_URL}/api/searches/save",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST_Search_Conakry",
                "region": "Conakry",
                "land_type": "residential",
                "min_price": 10000000,
                "max_price": 500000000,
                "notify_new_matches": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "search_id" in data
        assert data["message"] == "Recherche sauvegardée"
        print(f"Saved search created: {data['search_id']}")
        return data["search_id"]
    
    def test_save_search_requires_auth(self):
        """Test that saving search requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/searches/save",
            json={"name": "Test Search"}
        )
        assert response.status_code == 401
        print("Correctly requires authentication for saving search")
    
    def test_get_saved_searches(self, auth_token):
        """Test getting user's saved searches"""
        response = requests.get(
            f"{BASE_URL}/api/searches",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} saved searches")
    
    def test_get_saved_searches_requires_auth(self):
        """Test that getting searches requires authentication"""
        response = requests.get(f"{BASE_URL}/api/searches")
        assert response.status_code == 401
        print("Correctly requires authentication for getting searches")
    
    def test_delete_saved_search(self, auth_token):
        """Test deleting a saved search"""
        # First create a search to delete
        create_response = requests.post(
            f"{BASE_URL}/api/searches/save",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "TEST_To_Delete"}
        )
        assert create_response.status_code == 200
        search_id = create_response.json()["search_id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/searches/{search_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print(f"Deleted search: {search_id}")
    
    def test_execute_saved_search(self, auth_token):
        """Test executing a saved search"""
        # First create a search
        create_response = requests.post(
            f"{BASE_URL}/api/searches/save",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST_Execute_Search",
                "region": "Conakry",
                "status": "available"
            }
        )
        assert create_response.status_code == 200
        search_id = create_response.json()["search_id"]
        
        # Execute the search
        exec_response = requests.get(
            f"{BASE_URL}/api/searches/{search_id}/results",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert exec_response.status_code == 200
        data = exec_response.json()
        assert "results" in data
        assert "count" in data
        print(f"Search returned {data['count']} results")


class TestRegionsAndStats:
    """Test existing endpoints still work"""
    
    def test_get_regions(self):
        """Test regions endpoint"""
        response = requests.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 8  # Guinea has 8 regions
        print(f"Regions: {[r['name'] for r in data]}")
    
    def test_get_stats(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_lands" in data
        assert "available_lands" in data
        assert "total_transactions" in data
        print(f"Stats: {data['total_lands']} lands, {data['total_transactions']} transactions")
    
    def test_get_lands(self):
        """Test lands listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/lands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} lands")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_searches(self):
        """Clean up TEST_ prefixed saved searches"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Cannot login for cleanup")
        
        token = login_response.json()["token"]
        
        # Get all searches
        searches_response = requests.get(
            f"{BASE_URL}/api/searches",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if searches_response.status_code == 200:
            searches = searches_response.json()
            deleted = 0
            for search in searches:
                if search.get("name", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/searches/{search['search_id']}",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    deleted += 1
            print(f"Cleaned up {deleted} test searches")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
