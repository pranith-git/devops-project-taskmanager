import time
import unittest
from uuid import uuid4

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TaskManagerSeleniumTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.driver = webdriver.Chrome()
        cls.driver.set_window_size(1400, 1000)
        cls.wait = WebDriverWait(cls.driver, 10)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def register_and_login(self, username, password):
        self.driver.get("http://127.0.0.1:8081/login.html")
        time.sleep(1.5)

        username_input = self.wait.until(
            EC.visibility_of_element_located((By.ID, "username"))
        )
        password_input = self.wait.until(
            EC.visibility_of_element_located((By.ID, "password"))
        )
        register_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, "register-btn"))
        )

        username_input.clear()
        username_input.send_keys(username)
        time.sleep(1.5)
        password_input.clear()
        password_input.send_keys(password)
        time.sleep(1.5)
        register_btn.click()
        time.sleep(1.5)

        self.wait.until(EC.url_contains("index.html"))
        self.assertIn("index.html", self.driver.current_url)

    def test_login_page_success(self):
        """Create a user account through the login page and confirm the dashboard loads."""
        username = f"selenium_{uuid4().hex[:8]}"
        password = "SecurePass123!"

        self.register_and_login(username, password)

        self.assertIn("Task Manager", self.driver.title)
        self.assertIn("index.html", self.driver.current_url)

    def test_add_task(self):
        """Login, then add a task and assert it appears in the task list."""
        username = f"taskuser_{uuid4().hex[:8]}"
        password = "SecurePass123!"
        task_text = f"Selenium task {uuid4().hex[:8]}"

        self.register_and_login(username, password)

        task_input = self.wait.until(
            EC.visibility_of_element_located((By.ID, "task-input"))
        )
        add_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "#task-form button[type='submit']"))
        )

        task_input.clear()
        task_input.send_keys(task_text)
        time.sleep(1.5)
        add_button.click()
        time.sleep(1.5)

        task_item = self.wait.until(
            EC.visibility_of_element_located((By.XPATH, f"//li[contains(., '{task_text}')]"))
        )
        self.assertIn(task_text, task_item.text)


if __name__ == "__main__":
    unittest.main()
