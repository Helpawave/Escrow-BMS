// import { logEvent } from 'firebase/analytics';

export const useAnalytics = () => {
  const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
    // No-op: Firebase Analytics disabled
    console.log(`[Analytics-Disabled] Event: ${eventName}`, parameters);
  };

  const trackPageView = (pageName: string) => {
    trackEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
    });
  };

  const trackInvoiceCreated = (invoiceId: string, amount: number) => {
    trackEvent('invoice_created', {
      invoice_id: invoiceId,
      value: amount,
      currency: 'USD',
    });
  };

  const trackInvoicePaid = (invoiceId: string, amount: number) => {
    trackEvent('invoice_paid', {
      invoice_id: invoiceId,
      value: amount,
      currency: 'USD',
    });
  };

  const trackClientAdded = (clientId: string) => {
    trackEvent('client_added', {
      client_id: clientId,
    });
  };

  const trackProductAdded = (productId: string) => {
    trackEvent('product_added', {
      product_id: productId,
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackInvoiceCreated,
    trackInvoicePaid,
    trackClientAdded,
    trackProductAdded,
  };
};
