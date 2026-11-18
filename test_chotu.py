import unittest
from products import get_all_products, filter_by_criteria, find_cheaper_alternatives, PRODUCTS_DATA
from voice_commands import parse_intent_locally, normalize_speech, extract_color, extract_product_type_and_category, extract_price_limit
from cart import CartManager

class TestOyeChotuVoiceShopping(unittest.TestCase):

    def test_1_black_shoes_exact_match(self):
        """1. Black shoes -> no red, blue, or white shoes in exact results."""
        intent = parse_intent_locally("Show me black shoes")
        self.assertEqual(intent["intent"], "search")
        self.assertEqual(intent["parameters"]["requested_type"], "shoes")
        self.assertEqual(intent["parameters"]["requested_color"], "black")

        res = filter_by_criteria(
            PRODUCTS_DATA,
            requested_type=intent["parameters"]["requested_type"],
            requested_color=intent["parameters"]["requested_color"]
        )
        exact = res["exact_matches"]
        self.assertGreaterEqual(len(exact), 4, "Should find multiple black shoes")
        for p in exact:
            self.assertEqual(p["product_type"], "shoes")
            self.assertEqual(p["color"], "black", f"Expected black shoe, got {p['color']} for {p['name']}")
            self.assertNotIn("red", p["name"].lower())
            self.assertNotIn("crimson", p["name"].lower())

    def test_2_blue_kurti_exact_match(self):
        """2. Blue kurti -> no black or red kurtis in exact results."""
        intent = parse_intent_locally("Mujhe blue kurti dikhao")
        self.assertEqual(intent["intent"], "search")
        self.assertEqual(intent["parameters"]["requested_type"], "kurti")
        self.assertEqual(intent["parameters"]["requested_color"], "blue")

        res = filter_by_criteria(
            PRODUCTS_DATA,
            requested_type=intent["parameters"]["requested_type"],
            requested_color=intent["parameters"]["requested_color"]
        )
        exact = res["exact_matches"]
        self.assertGreaterEqual(len(exact), 2, "Should find blue kurtis")
        for p in exact:
            self.assertEqual(p["product_type"], "kurti")
            self.assertEqual(p["color"], "blue", f"Expected blue kurti, got {p['color']}")
            self.assertNotEqual(p["color"], "black")
            self.assertNotEqual(p["color"], "red")

    def test_3_red_shoes_under_1500(self):
        """3. Red shoes under 1500 -> every result is red, is a shoe, and costs at most 1500."""
        intent = parse_intent_locally("Red shoes under 1500")
        self.assertEqual(intent["intent"], "search")
        self.assertEqual(intent["parameters"]["requested_type"], "shoes")
        self.assertEqual(intent["parameters"]["requested_color"], "red")
        self.assertEqual(intent["parameters"]["max_price"], 1500)

        res = filter_by_criteria(
            PRODUCTS_DATA,
            requested_type=intent["parameters"]["requested_type"],
            requested_color=intent["parameters"]["requested_color"],
            max_price=intent["parameters"]["max_price"]
        )
        exact = res["exact_matches"]
        self.assertGreaterEqual(len(exact), 2)
        for p in exact:
            self.assertEqual(p["product_type"], "shoes")
            self.assertEqual(p["color"], "red")
            self.assertLessEqual(p["price"], 1500)

    def test_4_black_kurti_under_500_truthful_empty(self):
        """4. Black kurti under 500 -> only qualifying products or truthful empty state."""
        res = filter_by_criteria(
            PRODUCTS_DATA,
            requested_type="kurti",
            requested_color="black",
            max_price=500
        )
        exact = res["exact_matches"]
        # In our catalogue black kurtis start at 699, so exact should be empty
        self.assertEqual(len(exact), 0, "No black kurti under 500 should be returned if none exist")

    def test_5_zero_match_no_unrelated_products(self):
        """5. A colour/category combination with zero matches -> no unrelated products."""
        res = filter_by_criteria(
            PRODUCTS_DATA,
            requested_type="shoes",
            requested_color="pink",  # No pink shoes in catalogue
            max_price=1000
        )
        self.assertEqual(len(res["exact_matches"]), 0, "Must NEVER return non-pink shoes in exact matches")

    def test_6_marathi_command_black_kurti_under_1000(self):
        """Mala 1000 rupayanchya aat black kurti dakhav"""
        intent = parse_intent_locally("Mala 1000 rupayanchya aat black kurti dakhav")
        self.assertEqual(intent["intent"], "search")
        self.assertEqual(intent["parameters"]["requested_type"], "kurti")
        self.assertEqual(intent["parameters"]["requested_color"], "black")
        self.assertEqual(intent["parameters"]["max_price"], 1000)

        res = filter_by_criteria(
            PRODUCTS_DATA,
            requested_type="kurti",
            requested_color="black",
            max_price=1000
        )
        exact = res["exact_matches"]
        self.assertGreaterEqual(len(exact), 2)
        for p in exact:
            self.assertLessEqual(p["price"], 1000)
            self.assertEqual(p["color"], "black")

    def test_7_cart_actions_add_position_and_total(self):
        """Add second product to cart, check total, quantity update, undo."""
        cart = CartManager(initial_budget=1500)
        prods = [
            {"id": "p1", "name": "Item 1", "price": 400},
            {"id": "p2", "name": "Item 2", "price": 600},
            {"id": "p3", "name": "Item 3", "price": 900},
        ]
        # Add 2nd product
        item = cart.add_by_displayed_position(prods, position=2, quantity=1)
        self.assertIsNotNone(item)
        self.assertEqual(item["product"]["id"], "p2")
        self.assertEqual(cart.get_total(), 600)

        # Update quantity to 2
        cart.update_quantity("p2", 2)
        self.assertEqual(cart.get_total(), 1200)

        # Undo
        cart.undo_last_action()
        self.assertEqual(cart.get_total(), 600)

if __name__ == "__main__":
    unittest.main()
