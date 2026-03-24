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

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_data = {
            "email": "admin@guinealand.com",
            "password": "admin123"
        }
        
        success, data = self.run_test("Admin Login", "POST", "auth/login", 200, admin_data)
        if success and 'token' in data:
            self.token = data['token']
            self.log_test("Admin Login Token Validation", True, f"Admin token received")
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard endpoint"""
        if not self.token:
            self.log_test("Admin Dashboard", False, "No token available")
            return False
            
        success, data = self.run_test("Admin Dashboard", "GET", "admin/dashboard", 200)
        if success and isinstance(data, dict):
            required_fields = ['total_users', 'total_lands', 'pending_verification', 'verified_lands', 'total_transactions']
            missing_fields = [f for f in required_fields if f not in data]
            if not missing_fields:
                self.log_test("Admin Dashboard Data Validation", True, f"All required fields present")
                return True
            else:
                self.log_test("Admin Dashboard Data Validation", False, f"Missing fields: {missing_fields}")
                return False
        return success

    def test_admin_pending_lands(self):
        """Test admin pending lands endpoint"""
        if not self.token:
            self.log_test("Admin Pending Lands", False, "No token available")
            return False
            
        success, data = self.run_test("Admin Pending Lands", "GET", "admin/lands/pending", 200)
        if success and isinstance(data, list):
            self.log_test("Admin Pending Lands Data Validation", True, f"Found {len(data)} pending lands")
            return True
        return success

    def test_file_upload_endpoint(self):
        """Test file upload endpoint"""
        if not self.token:
            self.log_test("File Upload", False, "No token available")
            return False
        
        # Create a simple test PDF content (minimal PDF structure)
        test_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        files = {'file': ('test.pdf', test_content, 'application/pdf')}
        
        url = f"{self.base_url}/upload?file_type=document"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.post(url, files=files, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                try:
                    data = response.json()
                    if 'file_id' in data and 'url' in data:
                        self.log_test("File Upload", True, f"File uploaded with ID: {data['file_id']}")
                        return True, data['file_id']
                    else:
                        self.log_test("File Upload", False, "Missing file_id or url in response")
                        return False, None
                except:
                    self.log_test("File Upload", False, "Invalid JSON response")
                    return False, None
            else:
                try:
                    error_data = response.json()
                    self.log_test("File Upload", False, f"Status {response.status_code}: {error_data}")
                except:
                    self.log_test("File Upload", False, f"Status {response.status_code}: {response.text[:200]}")
                return False, None
                
        except Exception as e:
            self.log_test("File Upload", False, f"Error: {str(e)}")
            return False, None

    def test_file_download(self, file_id):
        """Test file download endpoint"""
        if not file_id:
            self.log_test("File Download", False, "No file_id provided")
            return False
            
        success, _ = self.run_test("File Download", "GET", f"files/{file_id}", 200)
        return success

    def test_land_verification(self, land_id):
        """Test land verification endpoint"""
        if not self.token or not land_id:
            self.log_test("Land Verification", False, "No token or land_id available")
            return False
            
        verify_data = {"notes": "Test verification"}
        success, data = self.run_test("Land Verification", "POST", f"admin/lands/{land_id}/verify", 200, verify_data)
        return success

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints require authentication"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        # Test endpoints that should require auth
        protected_tests = [
            ("Users List (No Auth)", "GET", "users", 401),
            ("Create Land (No Auth)", "POST", "lands", 401),
            ("Get Transactions (No Auth)", "GET", "transactions", 401),
            ("Admin Dashboard (No Auth)", "GET", "admin/dashboard", 401),
            ("File Upload (No Auth)", "POST", "upload", 401)
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
    
    # Test admin authentication
    print("\n👑 Testing Admin Authentication...")
    admin_login_success = tester.test_admin_login()
    
    if admin_login_success:
        print("\n🔧 Testing Admin Features...")
        tester.test_admin_dashboard()
        tester.test_admin_pending_lands()
        
        print("\n📁 Testing File Upload Features...")
        upload_success, file_id = tester.test_file_upload_endpoint()
        if upload_success and file_id:
            tester.test_file_download(file_id)
        
        # Test land creation and verification
        print("\n🏞️ Testing Land Management...")
        tester.test_lands_endpoint()
        land_success, land_id = tester.test_create_land()
        if land_success and land_id:
            tester.test_land_verification(land_id)
    else:
        print("❌ Admin login failed, skipping admin tests")
    
    # Test regular user authentication
    print("\n🔐 Testing Regular User Authentication...")
    reg_success, user_data = tester.test_user_registration()
    
    if reg_success:
        login_success = tester.test_user_login(user_data['email'], user_data['password'])
        
        if login_success:
            tester.test_get_current_user()
        else:
            print("❌ Regular user login failed")
    else:
        print("❌ Registration failed")
    
    # Test auth protection
    print("\n🛡️ Testing Auth Protection...")
    tester.test_protected_endpoints_without_auth()
    
    tester.print_summary()
    
    # Return exit code based on success rate
    success_rate = tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0
    return 0 if success_rate >= 0.8 else 1

if __name__ == "__main__":
    sys.exit(main())