"""
Cart management and budget tracking module for Oye Chotu! Voice-First Shopping.
Supports adding, quantity updates, deletion, undo history, budget calculations, and order creation.
"""

from typing import List, Dict, Any, Optional
import copy
import uuid


class CartManager:
    def __init__(self, initial_budget: int = 1500):
        self.items: List[Dict[str, Any]] = []  # list of {"product": dict, "quantity": int}
        self.budget: int = initial_budget
        self.history: List[List[Dict[str, Any]]] = []  # snapshot history for undo
        self.last_action_desc: str = ""

    def _save_history(self, desc: str) -> None:
        self.history.append(copy.deepcopy(self.items))
        self.last_action_desc = desc
        if len(self.history) > 20:
            self.history.pop(0)

    def set_budget(self, amount: int) -> int:
        self.budget = amount
        return self.budget

    def add_item(self, product: Dict[str, Any], quantity: int = 1) -> Dict[str, Any]:
        self._save_history(f"Added {product['name']}")
        for item in self.items:
            if item["product"]["id"] == product["id"]:
                item["quantity"] += quantity
                return item

        new_item = {"product": copy.deepcopy(product), "quantity": quantity}
        self.items.append(new_item)
        return new_item

    def add_by_displayed_position(self, displayed_products: List[Dict[str, Any]], position: int, quantity: int = 1) -> Optional[Dict[str, Any]]:
        idx = position - 1
        if 0 <= idx < len(displayed_products):
            target_prod = displayed_products[idx]
            return self.add_item(target_prod, quantity)
        return None

    def update_quantity(self, index_or_id: Any, quantity: int) -> bool:
        if quantity <= 0:
            return self.remove_item(index_or_id)

        self._save_history(f"Updated quantity to {quantity}")
        if isinstance(index_or_id, int):
            idx = index_or_id - 1 if index_or_id > 0 else 0
            if 0 <= idx < len(self.items):
                self.items[idx]["quantity"] = quantity
                return True
        elif isinstance(index_or_id, str):
            for item in self.items:
                if item["product"]["id"] == index_or_id:
                    item["quantity"] = quantity
                    return True
        elif len(self.items) > 0:
            self.items[-1]["quantity"] = quantity
            return True
        return False

    def remove_item(self, index_or_id: Any) -> bool:
        self._save_history("Removed item from cart")
        if isinstance(index_or_id, int):
            idx = index_or_id - 1 if index_or_id > 0 else 0
            if 0 <= idx < len(self.items):
                self.items.pop(idx)
                return True
        elif isinstance(index_or_id, str):
            for i, item in enumerate(self.items):
                if item["product"]["id"] == index_or_id:
                    self.items.pop(i)
                    return True
        return False

    def undo_last_action(self) -> bool:
        """Reverts the last cart modification."""
        if self.history:
            self.items = self.history.pop()
            return True
        return False

    def get_total(self) -> int:
        return sum(item["product"]["price"] * item["quantity"] for item in self.items)

    def get_remaining_budget(self) -> int:
        return self.budget - self.get_total()

    def get_item_count(self) -> int:
        return sum(item["quantity"] for item in self.items)

    def clear(self) -> None:
        self._save_history("Cleared cart")
        self.items = []

    def create_order(self) -> Optional[Dict[str, Any]]:
        if not self.items:
            return None
        order_id = f"OC-{uuid.uuid4().hex[:8].upper()}"
        total = self.get_total()
        summary = ", ".join(f"{it['product']['name']} (x{it['quantity']})" for it in self.items)
        order = {
            "order_id": order_id,
            "total_amount": total,
            "item_count": self.get_item_count(),
            "items_summary": summary,
            "items": copy.deepcopy(self.items),
            "budget": self.budget,
            "remaining_budget": self.get_remaining_budget(),
        }
        return order
