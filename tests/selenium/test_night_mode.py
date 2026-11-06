import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from base import TaskManagerSeleniumTestCase


class NightModeSeleniumTests(TaskManagerSeleniumTestCase):
    def test_night_mode_toggle(self):
        self.register_and_login()

        theme_toggle = self.wait.until(
            EC.element_to_be_clickable((By.ID, "theme-toggle"))
        )
        initial_theme = self.driver.find_element(
            By.TAG_NAME, "html"
        ).get_attribute("data-theme")
        expected_theme = "light" if initial_theme == "dark" else "dark"

        theme_toggle.click()
        time.sleep(1.5)

        self.wait.until(
            lambda driver: driver.find_element(
                By.TAG_NAME, "html"
            ).get_attribute("data-theme") == expected_theme
        )
        self.assertEqual(
            self.driver.find_element(By.ID, "theme-toggle").get_attribute(
                "aria-pressed"
            ),
            str(expected_theme == "dark").lower(),
        )
        self.assertEqual(
            self.driver.execute_script(
                "return localStorage.getItem('taskManagerTheme')"
            ),
            expected_theme,
        )


if __name__ == "__main__":
    import unittest

    unittest.main()