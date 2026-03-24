import requests
import sys
import json
from datetime import datetime

class GuineaLandHubTester:
    def __init__(self, base_url="https://guinea-land-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (No JSON)")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {error_data}")
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_regions_endpoint(self):
        """Test regions endpoint"""
        success, data = self.run_test("Get Regions", "GET", "regions", 200)
        if success and isinstance(data, list) and len(data) > 0:
            self.log_test("Regions Data Validation", True, f"Found {len(data)} regions")
            return True
        elif success:
            self.log_test("Regions Data Validation", False, "Empty regions list")
            return False
        return success

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        success, data = self.run_test("Get Stats", "GET", "stats", 200)
        if success and isinstance(data, dict):
            required_fields = ['total_lands', 'total_users', 'total_transactions']
            missing_fields = [f for f in required_fields if f not in data]
            if not missing_fields:
                self.log_test("Stats Data Validation", True, f"All required fields present")
                return True
            else:
                self.log_test("Stats Data Validation", False, f"Missing fields: {missing_fields}")
                return False
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!",
            "role": "buyer",
            "phone": "+224123456789"
        }
        
        success, data = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        if success and 'user_id' in data:
            self.user_id = data['user_id']
            self.log_test("Registration Data Validation", True, f"User ID: {self.user_id}")
            return True, user_data
        return False, user_data

    def test_user_login(self, email, password):
        """Test user login"""
        login_data = {
            "email": email,
            "password": password
        }
        
        success, data = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if success and 'token' in data:
            self.token = data['token']
            self.log_test("Login Token Validation", True, f"Token received")
            return True
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_lands_endpoint(self):
        """Test lands endpoint"""
        success, data = self.run_test("Get Lands", "GET", "lands", 200)
        if success and isinstance(data, list):
            self.log_test("Lands Data Validation", True, f"Found {len(data)} lands")
            return True
        return success

    def test_create_land(self):
        """Test land creation"""
        if not self.token:
            self.log_test("Create Land", False, "No token available")
            return False
            
        land_data = {
            "title": "Test Land Property",
            "description": "A test land property for API testing",
            "price": 50000.0,
            "size": 1000.0,
            "region": "Conakry",
            "commune": "Kaloum",
            "address": "123 Test Street, Conakry",
            "latitude": 9.6412,
            "longitude": -13.6785,
            "land_type": "residential",
            "status": "available"
        }
        
        success, data = self.run_test("Create Land", "POST", "lands", 200, land_data)
        if success and 'land_id' in data:
            self.log_test("Land Creation Validation", True, f"Land ID: {data['land_id']}")
            return True, data['land_id']
        return False, None

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints require authentication"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        # Test endpoints that should require auth
        protected_tests = [
            ("Users List (No Auth)", "GET", "users", 401),
            ("Create Land (No Auth)", "POST", "lands", 401),
            ("Get Transactions (No Auth)", "GET", "transactions", 401)
        ]
        
        all_passed = True
        for test_name, method, endpoint, expected_status in protected_tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status)
            if not success:
                all_passed = False
        
        # Restore token
        self.token = temp_token
        return all_passed

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*50}")
        print(f"TEST SUMMARY")
        print(f"{'='*50}")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print(f"\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"- {result['test']}: {result['details']}")

def main():
    print("🧪 Starting Guinea Land Hub API Tests")
    print("="*50)
    
    tester = GuineaLandHubTester()
    
    # Test public endpoints
    print("\n📋 Testing Public Endpoints...")
    tester.test_root_endpoint()
    tester.test_regions_endpoint()
    tester.test_stats_endpoint()
    
    # Test authentication
    print("\n🔐 Testing Authentication...")
    reg_success, user_data = tester.test_user_registration()
    
    if reg_success:
        login_success = tester.test_user_login(user_data['email'], user_data['password'])
        
        if login_success:
            tester.test_get_current_user()
            
            # Test protected endpoints
            print("\n🔒 Testing Protected Endpoints...")
            tester.test_lands_endpoint()
            tester.test_create_land()
            
            # Test auth protection
            print("\n🛡️ Testing Auth Protection...")
            tester.test_protected_endpoints_without_auth()
        else:
            print("❌ Login failed, skipping protected endpoint tests")
    else:
        print("❌ Registration failed, skipping auth tests")
    
    tester.print_summary()
    
    # Return exit code based on success rate
    success_rate = tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0
    return 0 if success_rate >= 0.8 else 1

if __name__ == "__main__":
    sys.exit(main())