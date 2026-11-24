import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { ProductTransitionProvider } from './context/ProductTransitionContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { WhatsAppHelplineButton } from './components/WhatsAppHelplineButton';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { CmsPage } from './pages/CmsPage';
import { Studio3DPage } from './pages/Studio3DPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <StoreProvider>
            <BrowserRouter>
              <ProductTransitionProvider>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/studio" element={<Studio3DPage />} />
                  <Route path="/shop/:slug" element={<ProductPage />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                  <Route path="/track-order" element={<OrderTrackingPage />} />
                  <Route path="/shipping" element={<CmsPage defaultSlug="shipping-returns" />} />
                  <Route path="/shipping-returns" element={<CmsPage defaultSlug="shipping-returns" />} />
                  <Route path="/privacy-policy" element={<CmsPage defaultSlug="privacy-policy" />} />
                  <Route path="/page/:slug" element={<CmsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <CartDrawer />
                <WishlistDrawer />
                <WhatsAppHelplineButton />
              </ProductTransitionProvider>
            </BrowserRouter>
          </StoreProvider>
        </ToastProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
