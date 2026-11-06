import time
from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from base import TaskManagerSeleniumTestCase


class DeleteTaskSeleniumTests(TaskManagerSeleniumTestCase):
    def test_delete_task(self):
        self.register_and_login()
        task_text = f"Delete this task {uuid4().hex[:8]}"
        task_item = self.add_task(task_text)

        delete_button = task_item.find_element(
            By.CSS_SELECTOR, "button.task-delete"
        )
        delete_button.click()
        time.sleep(1.5)

        self.wait.until(
            EC.invisibility_of_element_located(
                (By.XPATH, f"//li[contains(., '{task_text}')]")
            )
        )
        self.assertNotIn(task_text, self.driver.page_source)


if __name__ == "__main__":
    import unittest

    unittest.main()