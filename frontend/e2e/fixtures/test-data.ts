/**
 * Test Fixtures and Mock Data for E2E Tests
 *
 * Centralized test data to ensure consistency across test suites
 */

export const TEST_DONORS = {
  portugal: {
    name: 'João Silva',
    email: 'joao.silva@test.com',
    phone: '+351912345678',
  },
  brazil: {
    name: 'Maria Santos',
    email: 'maria.santos@test.com',
    phone: '+5511987654321',
    cpf: '123.456.789-00',
  },
};

export const TEST_AMOUNTS = {
  small: {
    EUR: 10,
    BRL: 20,
  },
  medium: {
    EUR: 50,
    BRL: 100,
  },
  large: {
    EUR: 200,
    BRL: 500,
  },
};

/**
 * Stripe Test Card Numbers
 * Source: https://stripe.com/docs/testing#cards
 */
export const STRIPE_TEST_CARDS = {
  // Successful payments
  success: '4242424242424242',
  successVisa: '4242424242424242',
  successMastercard: '5555555555554444',
  successAmex: '378282246310005',

  // Declined cards
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  lostCard: '4000000000009987',
  stolenCard: '4000000000009979',

  // 3D Secure authentication
  requiresAuthentication: '4000002500003155',
  authenticationFails: '4000008400001629',

  // Processing errors
  processingError: '4000000000000119',
  incorrectCVC: '4000000000000127',
};

/**
 * Mock PIX Response
 */
export const MOCK_PIX_RESPONSE = {
  success: true,
  paymentMethod: 'pix',
  payment: {
    paymentIntentId: 'pi_mock_123456789',
    status: 'pending_confirmation',
    pixKey: '00020126580014br.gov.bcb.pix01364d663c64-6f8e-4f8a-8f1b-7e3d2c1b0a9952040000530398654041.005802BR5913AUBRIGO ONG6009SAO PAULO62410503***50300017br.gov.bcb.brcode01051.0.06304ABCD',
    pixKeyType: 'EVP',
    pixQrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    instructions: 'Abra seu aplicativo bancário e escaneie o QR Code ou copie a chave PIX.',
  },
};

/**
 * Mock MB WAY Response
 */
export const MOCK_MBWAY_RESPONSE = {
  success: true,
  paymentMethod: 'mbway',
  payment: {
    paymentIntentId: 'pi_mock_mbway_123',
    status: 'processing',
    clientSecret: 'pi_mock_mbway_123_secret_abc',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    instructions: 'Confirme o pagamento no seu telemóvel MB WAY.',
  },
};

/**
 * Mock Multibanco Response
 */
export const MOCK_MULTIBANCO_RESPONSE = {
  success: true,
  paymentMethod: 'multibanco',
  payment: {
    paymentIntentId: 'pi_mock_mb_123',
    status: 'pending_confirmation',
    entity: '12345',
    reference: '123456789',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    instructions: [
      'Dirija-se a uma caixa ATM Multibanco',
      'Selecione "Pagamentos de Serviços"',
      'Introduza a Entidade e a Referência',
      'Confirme o valor e efetue o pagamento',
    ],
  },
};

/**
 * Mock Boleto Response
 */
export const MOCK_BOLETO_RESPONSE = {
  success: true,
  paymentMethod: 'boleto',
  payment: {
    paymentIntentId: 'pi_mock_boleto_123',
    status: 'pending_confirmation',
    boletoUrl: 'https://example.com/boleto/mock_123.pdf',
    boletoBarcode: '23793.38128 60000.123456 78901.234567 8 12340000050000',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    instructions: 'Pague o boleto em qualquer banco, lotérica ou pelo aplicativo do seu banco.',
  },
};

/**
 * Mock ONGs for Testing
 */
export const MOCK_ONGS = [
  {
    id: 'ong-pt-1',
    name: 'Animais de Rua Lisboa',
    country: 'PT',
    city: 'Lisboa',
    email: 'contato@animaisderua.pt',
    phone: '+351211234567',
  },
  {
    id: 'ong-pt-2',
    name: 'Porto Animal Care',
    country: 'PT',
    city: 'Porto',
    email: 'info@portoanimalcare.pt',
    phone: '+351221234567',
  },
  {
    id: 'ong-br-1',
    name: 'SOS Animais São Paulo',
    country: 'BR',
    city: 'São Paulo',
    email: 'contato@sosanimais.com.br',
    phone: '+5511987654321',
  },
  {
    id: 'ong-br-2',
    name: 'Proteção Animal Rio',
    country: 'BR',
    city: 'Rio de Janeiro',
    email: 'contato@protecaoanimal.com.br',
    phone: '+5521987654321',
  },
];

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  donations: '/api/v1/donations',
  ongs: '/api/v1/ongs',
  paymentStatus: (paymentIntentId: string) => `/api/v1/payments/${paymentIntentId}/status`,
};

/**
 * Payment Status Polling Configuration
 */
export const PAYMENT_POLLING_CONFIG = {
  intervalMs: 3000,
  maxAttempts: 40, // 2 minutes
  timeoutMs: 120000,
};
