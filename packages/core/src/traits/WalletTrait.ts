/**
 * Wallet Trait
 *
 * Wallet connection and identity
 *
 * @version 1.0.0
 */

import type { TraitHandler } from './VRTraitSystem';

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// HANDLER
// =============================================================================

export const walletHandler: TraitHandler<any> = {
  name: 'wallet' as any,

  defaultConfig: { supported_wallets: [], auto_connect: false, display_address: false, display_ens: true, sign_message_prompt: '', network: 'mainnet' },

  onAttach(node, config, context) {
    const state: Record<string, unknown> = { isConnected: false, address: null, ensName: null };
    (node as any).__walletState = state;
  },

  onDetach(node) {
    delete (node as any).__walletState;
  },

  onUpdate(node, config, context, delta) {
    const state = (node as any).__walletState;
    if (!state) return;

    // Emit lifecycle hooks as needed
      // context.emit('on_wallet_connected', { node });
  },

  onEvent(node, config, context, event) {
    const state = (node as any).__walletState;
    if (!state) return;
  },
};

export default walletHandler;
