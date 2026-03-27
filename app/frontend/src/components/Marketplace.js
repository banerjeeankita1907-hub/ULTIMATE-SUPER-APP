import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId) => {
    try {
      await axios.post(`${API}/cart/add?product_id=${productId}&quantity=1`);
      fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API}/cart/remove/${productId}`);
      fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 fade-in" data-testid="marketplace">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">🛒 Marketplace</h1>
          <p className="text-gray-400">Discover amazing products</p>
        </div>
        <button
          data-testid="cart-button"
          onClick={() => setShowCart(!showCart)}
          className="px-6 py-3 rounded-lg btn-gradient font-semibold relative"
        >
          🛒 Cart ({cart?.items?.length || 0})
        </button>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed right-0 top-0 h-full w-full md:w-96 glass-effect-strong z-50 p-6 overflow-y-auto" data-testid="cart-sidebar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Cart</h2>
            <button
              data-testid="close-cart-button"
              onClick={() => setShowCart(false)}
              className="text-2xl hover:text-red-400"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {cart?.items?.map((item, index) => (
              <div key={item.product_id} className="glass-effect p-4" data-testid={`cart-item-${index}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">Product</p>
                    <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <button
                    data-testid={`remove-cart-item-${index}`}
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <p className="font-bold gradient-text">${item.price * item.quantity}</p>
              </div>
            ))}

            {(!cart?.items || cart.items.length === 0) && (
              <p className="text-gray-400 text-center py-8" data-testid="empty-cart">Your cart is empty</p>
            )}
          </div>

          {cart?.items && cart.items.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-2xl font-bold gradient-text" data-testid="cart-total">
                  ${cart.total.toFixed(2)}
                </span>
              </div>
              <button
                data-testid="checkout-button"
                className="w-full py-3 rounded-lg btn-gradient font-semibold"
                onClick={() => alert('Checkout functionality - Connect Stripe for real payments!')}
              >
                Checkout 🚀
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="products-grid">
        {products.map((product, index) => (
          <div key={product.id} className="glass-effect p-6 card-hover" data-testid={`product-${index}`}>
            <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center text-6xl">
              📦
            </div>
            <h3 className="text-xl font-bold mb-2" data-testid={`product-${index}-name`}>{product.name}</h3>
            <p className="text-gray-400 mb-4 line-clamp-2" data-testid={`product-${index}-description`}>{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold gradient-text" data-testid={`product-${index}-price`}>
                ${product.price}
              </span>
              <button
                data-testid={`add-to-cart-${index}`}
                onClick={() => addToCart(product.id)}
                className="px-4 py-2 rounded-lg btn-gradient"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-span-full glass-effect p-12 text-center" data-testid="no-products">
            <p className="text-gray-400 text-lg">No products available yet. Check back soon! 🛒</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
