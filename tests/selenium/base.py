import time
import unittest
from uuid import uuid4

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TaskManagerSeleniumTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.driver = webdriver.Chrome()
        cls.driver.set_window_size(1400, 1000)
        cls.wait = WebDriverWait(cls.driver, 10)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def register_and_login(self):
        username = f"selenium_{uuid4().hex[:8]}"
        password = "SecurePass123!"
        self.driver.get("http://127.0.0.1:8081/login.html")
        time.sleep(1.5)

        username_input = self.wait.until(
            EC.visibility_of_element_located((By.ID, "username"))
        )
        password_input = self.wait.until(
            EC.visibility_of_element_located((By.ID, "password"))
        )
        register_button = self.wait.until(
            EC.element_to_be_clickable((By.ID, "register-btn"))
        )

        username_input.send_keys(username)
        time.sleep(1.5)
        password_input.send_keys(password)
        time.sleep(1.5)
        register_button.click()
        time.sleep(1.5)

        self.wait.until(EC.url_contains("index.html"))
        return username

    def add_task(self, task_text):
        task_input = self.wait.until(
            EC.visibility_of_element_located((By.ID, "task-input"))
        )
        task_input.send_keys(task_text)
        time.sleep(1.5)
        self.wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "#task-form button[type='submit']")
            )
        ).click()
        time.sleep(1.5)
        return self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, f"//li[contains(., '{task_text}')]")
            )
        )