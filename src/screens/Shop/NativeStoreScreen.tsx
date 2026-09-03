import { MemberCard, MemberPill } from '@/components/member';
import {
	nativeCommerce,
	NativeCommerceError,
	isNativeStoreResponse,
	type NativeCartResponse,
	type NativeCheckoutResponse,
	type NativeOrderDetail,
	type NativeOrderSummary,
	type NativeStoreProduct,
	type NativeStoreResponse,
} from '@/services/nativeCommerce';
import {
	addCartLine,
	removeCartLine,
	setCartLineQuantity,
} from '@/services/nativeCommerce/cart';
import type { NativeCommerceIdentity } from '@/services/nativeCommerce/protocol';
import { memberTheme } from '@/theme/member';
import { useStripe } from '@stripe/stripe-react-native';
import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	Linking,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	type StyleProp,
	type TextProps,
	type TextStyle,
	type ViewStyle,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NativeStoreScreenProps = {
  identity: NativeCommerceIdentity;
  initialStore?: NativeStoreResponse | null;
  countryCode?: string;
  isTestMode?: boolean;
};

type ShippingAddressForm = {
  first_name: string;
  last_name: string;
  line_1: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
};

const money = (value: { minor: number; currency: string }) =>
  `${value.currency} ${(value.minor / 100).toFixed(2)}`;

const primaryVariant = (product: NativeStoreProduct) => product.variants[0] ?? null;

const storeLayout = {
  screenGutter: memberTheme.spacing.lg,
  minTouchTarget: 44,
  primaryHeight: 48,
} as const;

type StoreTextRole = 'screenTitle' | 'sectionTitle' | 'body' | 'label' | 'meta' | 'button';
type StoreTextProps = Omit<TextProps, 'role' | 'style'> & {
  role?: StoreTextRole;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
};

const StoreText = ({ role = 'body', muted = false, style, ...props }: StoreTextProps) => {
  const roleStyle = role === 'screenTitle'
    ? styles.screenTitleText
    : role === 'sectionTitle'
      ? styles.sectionTitleText
      : role === 'label'
        ? styles.labelText
        : role === 'meta'
          ? styles.metaText
          : role === 'button'
            ? styles.buttonText
            : styles.bodyText;

  return <Text {...props} style={[styles.storeText, roleStyle, muted && styles.mutedText, style]} />;
};

type StoreScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

const StoreScreen = ({ children, style, contentContainerStyle }: StoreScreenProps) => (
  <SafeAreaView style={[styles.screen, style]}>
    <View style={[styles.screenContainer, contentContainerStyle]}>{children}</View>
  </SafeAreaView>
);

type StoreButtonProps = {
  label: string;
  compact?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const StoreButton = ({ label, compact = false, disabled = false, onPress, style, testID }: StoreButtonProps) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    style={[styles.storeButton, compact ? styles.compactButton : styles.primaryButton, disabled && styles.disabledButton, style]}
  >
    <StoreText role="button" style={disabled ? styles.disabledButtonText : styles.primaryButtonText}>{label}</StoreText>
  </Pressable>
);

type StoreStatus = 'default' | 'success' | 'warning' | 'danger' | 'info';

const statusPalette: Record<StoreStatus, { background: string; foreground: string }> = {
  default: { background: memberTheme.colors.surfaceSoft, foreground: memberTheme.colors.primaryInk },
  success: { background: '#EAF7EC', foreground: memberTheme.colors.success },
  warning: { background: '#FFF4DA', foreground: memberTheme.colors.warning },
  danger: { background: '#FDEDEC', foreground: memberTheme.colors.danger },
  info: { background: '#E8F1FF', foreground: '#0085FF' },
};

const StoreStatusPill = ({ label, status = 'default' }: { label: string; status?: StoreStatus }) => (
  <View style={[styles.statusPill, { backgroundColor: statusPalette[status].background }]} accessible accessibilityRole="text" accessibilityLabel={label}>
    <StoreText role="label" style={{ color: statusPalette[status].foreground }}>{label}</StoreText>
  </View>
);

// Preview branches deliberately keep the shared member refresh out. These local
// aliases keep the new store screen compatible with that stable preview surface.
const MemberButton = StoreButton;
const MemberScreen = StoreScreen;
const MemberStatusPill = StoreStatusPill;
const MemberText = StoreText;

export default function NativeStoreScreen({ identity, initialStore, countryCode, isTestMode = false }: NativeStoreScreenProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [store, setStore] = useState<NativeStoreResponse | null>(initialStore ?? null);
  const [cart, setCart] = useState<NativeCartResponse | null>(null);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orders, setOrders] = useState<NativeOrderSummary[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<NativeOrderDetail | null>(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<NativeStoreProduct | null>(null);
  const [confirmation, setConfirmation] = useState<NativeCheckoutResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialStore);
  const [refreshing, setRefreshing] = useState(false);
  const [busyVariantId, setBusyVariantId] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressForm>({
    first_name: identity.first,
    last_name: identity.last,
    line_1: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: countryCode?.toUpperCase() || 'AU',
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [nextStore, nextCart] = await Promise.all([
        nativeCommerce.getStore(identity, search || undefined, category),
        nativeCommerce.getCart(identity),
      ]);
      if (!isNativeStoreResponse(nextStore)) {
        throw new NativeCommerceError('legacy_fallback', 'This gym is still using its existing store.', 404);
      }
      setStore(nextStore);
      setCart(nextCart);
    } catch (cause) {
      if (cause instanceof NativeCommerceError && cause.status === 404) {
        setError('This gym is still using its existing store.');
      } else {
        setError(cause instanceof Error ? cause.message : 'The store is temporarily unavailable.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, identity, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const addToCart = async (product: NativeStoreProduct, variantId = primaryVariant(product)?.variant_id) => {
    const variant = product.variants.find(item => item.variant_id === variantId) ?? primaryVariant(product);
    if (!variant || product.stock_status === 'out_of_stock') return;
    setBusyVariantId(variant.variant_id);
    try {
      const currentLines = cart?.lines.map((line) => ({
        variant_id: line.variant_id,
        quantity: line.quantity,
      })) ?? [];
      const nextLines = addCartLine(currentLines, variant.variant_id);
      setCart(await nativeCommerce.replaceCart(identity, nextLines));
      setCartOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your cart.');
    } finally {
      setBusyVariantId(null);
    }
  };

  const updateCartQuantity = async (variantId: string, quantity: number) => {
    setBusyVariantId(variantId);
    try {
      const currentLines = cart?.lines.map(line => ({
        variant_id: line.variant_id,
        quantity: line.quantity,
      })) ?? [];
      setCart(await nativeCommerce.replaceCart(identity, setCartLineQuantity(currentLines, variantId, quantity)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your cart.');
    } finally {
      setBusyVariantId(null);
    }
  };

  const removeFromCart = async (variantId: string) => {
    setBusyVariantId(variantId);
    try {
      const currentLines = cart?.lines.map(line => ({
        variant_id: line.variant_id,
        quantity: line.quantity,
      })) ?? [];
      setCart(await nativeCommerce.replaceCart(identity, removeCartLine(currentLines, variantId)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your cart.');
    } finally {
      setBusyVariantId(null);
    }
  };

  const visibleCategories = useMemo(() => store?.categories ?? [], [store]);
  const cartCount = cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await nativeCommerce.getOrders(identity);
      setOrders(response.orders);
      setOrdersLoaded(true);
    } catch (cause) {
      setOrdersError(cause instanceof Error ? cause.message : 'Could not load your orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [identity]);

  const openOrders = () => {
    setCartOpen(false);
    setOrdersOpen(true);
    if (!ordersLoaded) void loadOrders();
  };

  const selectOrder = async (order: NativeOrderSummary) => {
    setSelectedOrderLoading(true);
    setOrdersError(null);
    try {
      const response = await nativeCommerce.getOrder(identity, order.order_id);
      setSelectedOrder(response.order);
    } catch (cause) {
      setOrdersError(cause instanceof Error ? cause.message : 'Could not load this order.');
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const updateAddress = (field: keyof ShippingAddressForm, value: string) => {
    setShippingAddress(current => ({ ...current, [field]: value }));
  };

  const checkout = async () => {
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const checkoutAddress = {
        ...shippingAddress,
        country_code: shippingAddress.country_code.trim().toUpperCase(),
        ...(shippingAddress.state.trim() ? { state: shippingAddress.state.trim() } : {}),
      };
      const prepared = await nativeCommerce.prepareCheckout(identity, checkoutAddress);
      if (store?.store_mode === 'shadow' || prepared.simulated) {
        setConfirmation(prepared);
        setCheckoutOpen(false);
        setCartOpen(false);
        await load(true);
        return;
      }
      if (!prepared.payment_intent_client_secret) {
        throw new Error('Secure payment is temporarily unavailable.');
      }
      const paymentSheet = await initPaymentSheet({
        merchantDisplayName: 'fitbox',
        paymentIntentClientSecret: prepared.payment_intent_client_secret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: `${shippingAddress.first_name} ${shippingAddress.last_name}`.trim(),
          address: {
            line1: shippingAddress.line_1,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postal_code,
            country: checkoutAddress.country_code,
          },
        },
        applePay: { merchantCountryCode: checkoutAddress.country_code },
        googlePay: {
          merchantCountryCode: checkoutAddress.country_code,
          currencyCode: prepared.currency.toUpperCase(),
          testEnv: isTestMode,
        },
      });
      if (paymentSheet.error) throw new Error(paymentSheet.error.message);
      const presented = await presentPaymentSheet();
      if (presented.error) throw new Error(presented.error.message);
      setCheckoutOpen(false);
      setCartOpen(false);
      await load(true);
      setConfirmation(prepared);
      setNotice(`Order #${prepared.order_number} submitted. We’ll update you when it ships.`);
    } catch (cause) {
      setCheckoutError(cause instanceof NativeCommerceError && cause.code === 'shipping_unavailable'
        ? 'We cannot ship this cart to that country yet. Please check your country or try again later.'
        : cause instanceof Error ? cause.message : 'Could not complete checkout.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  if (loading && !store) {
    return <MemberScreen><View style={styles.loading}><ActivityIndicator size="large" color={memberTheme.colors.primary} /><MemberText muted>Loading your gym store…</MemberText></View></MemberScreen>;
  }

  if (error && !store) {
    return <MemberScreen><View style={styles.empty}><MemberText role="screenTitle">Gym store</MemberText><MemberText muted style={styles.message}>{error}</MemberText></View></MemberScreen>;
  }

  return (
    <MemberScreen contentContainerStyle={styles.screenContent}>
      <FlatList
        testID="native-store-list"
        data={store?.products ?? []}
        keyExtractor={(item) => item.product_id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={memberTheme.colors.primary} />}
        ListHeaderComponent={<>
          <View style={styles.headerRow}>
            <View><MemberText role="screenTitle">Gym store</MemberText><MemberText muted>Essentials for your training week.</MemberText>{store?.store_mode === 'shadow' ? <MemberText muted style={styles.shadowNotice}>Test mode — checkout is simulated</MemberText> : null}</View>
            <View style={styles.headerActions}>
              <Pressable testID="native-orders-button" onPress={openOrders} style={styles.ordersButton} accessibilityRole="button" accessibilityLabel="View your orders"><MemberText role="button">Orders</MemberText></Pressable>
              <Pressable testID="native-cart-button" onPress={() => { setOrdersOpen(false); setCartOpen((open) => !open); }} style={styles.cartButton} accessibilityRole="button" accessibilityLabel={`Cart, ${cartCount} items`}><MemberText role="button" style={styles.cartButtonText}>Cart {cartCount}</MemberText></Pressable>
            </View>
          </View>
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => void load()} placeholder="Search products" placeholderTextColor={memberTheme.colors.textMuted} style={styles.search} returnKeyType="search" />
          <FlatList data={[{ slug: undefined, name: 'All' }, ...visibleCategories]} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.slug ?? 'all'} contentContainerStyle={styles.categoryList} renderItem={({ item }) => <MemberPill label={item.name} selected={category === item.slug} onPress={() => { setCategory(item.slug); }} />} />
          {error ? <MemberText muted style={styles.inlineError}>{error}</MemberText> : null}
        </>}
        renderItem={({ item }) => <ProductCard product={item} busy={busyVariantId === primaryVariant(item)?.variant_id} onAdd={() => void addToCart(item)} onOpen={() => setSelectedProduct(item)} />}
        ListEmptyComponent={<View style={styles.emptyProducts}><MemberText role="sectionTitle">No products found</MemberText><MemberText muted>Try another search or category.</MemberText></View>}
        contentContainerStyle={styles.listContent}
      />
      {notice ? <NoticePanel message={notice} onClose={() => setNotice(null)} /> : null}
      {confirmation ? <ConfirmationPanel confirmation={confirmation} onClose={() => setConfirmation(null)} /> : null}
      {selectedProduct ? <ProductDetailPanel product={selectedProduct} busy={busyVariantId !== null} onClose={() => setSelectedProduct(null)} onAdd={(variantId) => { void addToCart(selectedProduct, variantId); setSelectedProduct(null); }} /> : null}
      {ordersOpen ? <OrdersPanel
        orders={orders}
        loading={ordersLoading}
        error={ordersError}
        selectedOrder={selectedOrder}
        selectedOrderLoading={selectedOrderLoading}
        onClose={() => { setOrdersOpen(false); setSelectedOrder(null); setOrdersError(null); }}
        onRefresh={() => void loadOrders()}
        onSelect={order => void selectOrder(order)}
        onBack={() => { setSelectedOrder(null); setOrdersError(null); }}
      /> : cartOpen ? checkoutOpen ? <CheckoutPanel
        address={shippingAddress}
        busy={checkoutBusy}
        error={checkoutError}
        onChange={updateAddress}
        onBack={() => { setCheckoutOpen(false); setCheckoutError(null); }}
        onCheckout={() => void checkout()}
      /> : <CartSummary
        cart={cart}
        busyVariantId={busyVariantId}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={(variantId, quantity) => void updateCartQuantity(variantId, quantity)}
        onRemove={(variantId) => void removeFromCart(variantId)}
        onCheckout={() => { setCheckoutOpen(true); setCheckoutError(null); }}
      /> : null}
    </MemberScreen>
  );
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase());
}

function statusKind(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (['delivered', 'paid', 'fulfilled'].includes(status)) return 'success';
  if (['needs_review', 'payment_failed', 'cancelled', 'refunded'].includes(status)) return 'danger';
  if (['shipped', 'partially_shipped', 'partially_fulfilled'].includes(status)) return 'info';
  if (['pending_payment', 'unfulfilled', 'submitted', 'confirmed'].includes(status)) return 'warning';
  return 'default';
}

function OrdersPanel({
  orders,
  loading,
  error,
  selectedOrder,
  selectedOrderLoading,
  onClose,
  onRefresh,
  onSelect,
  onBack,
}: {
  orders: NativeOrderSummary[];
  loading: boolean;
  error: string | null;
  selectedOrder: NativeOrderDetail | null;
  selectedOrderLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSelect: (order: NativeOrderSummary) => void;
  onBack: () => void;
}) {
  return <View style={styles.ordersPanel}>
    <View style={styles.cartHeader}>
      <View>{selectedOrder ? <Pressable onPress={onBack}><MemberText role="button">‹ All orders</MemberText></Pressable> : null}<MemberText role="sectionTitle">{selectedOrder ? `Order #${selectedOrder.order_number}` : 'Your orders'}</MemberText></View>
      <View style={styles.panelActions}><Pressable onPress={onRefresh}><MemberText role="button">Refresh</MemberText></Pressable><Pressable onPress={onClose}><MemberText role="button">Close</MemberText></Pressable></View>
    </View>
    <ScrollView contentContainerStyle={styles.ordersContent} keyboardShouldPersistTaps="handled">
      {error ? <MemberText muted style={styles.checkoutError}>{error}</MemberText> : null}
      {selectedOrder ? <OrderDetailView order={selectedOrder} loading={selectedOrderLoading} /> : loading ? <View style={styles.ordersLoading}><ActivityIndicator size="small" color={memberTheme.colors.primary} /><MemberText muted>Loading your orders…</MemberText></View> : orders.length ? orders.map(order => <Pressable key={order.order_id} onPress={() => onSelect(order)} style={styles.orderRow} accessibilityRole="button" accessibilityLabel={`Order ${order.order_number}, ${statusLabel(order.status)}`}><View style={styles.orderRowCopy}><MemberText role="label">Order #{order.order_number}</MemberText><MemberText muted>{new Date(order.created_at).toLocaleDateString()}</MemberText><View style={styles.orderPills}><MemberStatusPill label={statusLabel(order.status)} status={statusKind(order.status)} /><MemberStatusPill label={statusLabel(order.fulfillment_status)} status={statusKind(order.fulfillment_status)} /></View></View><MemberText role="label">{money(order.total)} ›</MemberText></Pressable>) : <View style={styles.ordersEmpty}><MemberText role="sectionTitle">No orders yet</MemberText><MemberText muted>Your native store orders will appear here.</MemberText></View>}
    </ScrollView>
  </View>;
}

function OrderDetailView({ order, loading }: { order: NativeOrderDetail; loading: boolean }) {
  return <View>
    <View style={styles.orderSummary}><View style={styles.orderPills}><MemberStatusPill label={statusLabel(order.status)} status={statusKind(order.status)} /><MemberStatusPill label={statusLabel(order.payment_status)} status={statusKind(order.payment_status)} /></View><MemberText muted>{new Date(order.created_at).toLocaleDateString()}</MemberText><MemberText role="label" style={styles.orderTotal}>{money(order.total)}</MemberText></View>
    <MemberText role="label" style={styles.detailHeading}>Items</MemberText>
    {order.lines.map(line => <View key={line.line_id} style={styles.detailLine}><View style={styles.orderRowCopy}><MemberText>{line.quantity} × {line.title}</MemberText>{line.variant_label ? <MemberText muted>{line.variant_label}</MemberText> : null}</View><MemberText muted>{money(line.line_total)}</MemberText></View>)}
    <MemberText role="label" style={styles.detailHeading}>Delivery</MemberText>
    {loading ? <ActivityIndicator size="small" color={memberTheme.colors.primary} /> : order.fulfillment_groups.length ? order.fulfillment_groups.map(group => <View key={group.fulfillment_group_id} style={styles.fulfillmentCard}><View style={styles.fulfillmentHeader}><MemberText role="label">{group.supplier_name || 'Supplier fulfilment'}</MemberText><MemberStatusPill label={statusLabel(group.status)} status={statusKind(group.status)} /></View>{group.tracking_number ? <MemberText muted>Tracking: {group.tracking_number}</MemberText> : null}{group.tracking_url ? <Pressable onPress={() => void Linking.openURL(group.tracking_url!)}><MemberText role="button" style={styles.trackingLink}>Track shipment</MemberText></Pressable> : null}</View>) : <MemberText muted>Your order is being prepared.</MemberText>}
    <View style={styles.orderTotals}><View style={styles.detailLine}><MemberText muted>Subtotal</MemberText><MemberText muted>{money(order.subtotal)}</MemberText></View><View style={styles.detailLine}><MemberText muted>Shipping</MemberText><MemberText muted>{money(order.shipping)}</MemberText></View><View style={styles.detailLine}><MemberText role="label">Total</MemberText><MemberText role="label">{money(order.total)}</MemberText></View></View>
  </View>;
}

function NoticePanel({ message, onClose }: { message: string; onClose: () => void }) {
  return <View style={styles.noticePanel} accessibilityRole="alert">
    <MemberText muted style={styles.noticeCopy}>{message}</MemberText>
    <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss notification"><MemberText role="button">Close</MemberText></Pressable>
  </View>;
}

function ConfirmationPanel({ confirmation, onClose }: { confirmation: NativeCheckoutResponse; onClose: () => void }) {
  const simulated = confirmation.simulated || !confirmation.payment_intent_client_secret;
  return <View style={styles.confirmationPanel} accessibilityRole="alert">
    <MemberText role="sectionTitle">{simulated ? 'Test order recorded' : 'Order received'}</MemberText>
    <MemberText role="label" style={styles.confirmationNumber}>Order #{confirmation.order_number}</MemberText>
    <MemberText muted>{simulated ? 'No payment was taken and no supplier was notified.' : 'Your payment is being confirmed securely. We’ll update you when it ships.'}</MemberText>
    <View style={styles.orderTotals}>
      <View style={styles.detailLine}><MemberText muted>Subtotal</MemberText><MemberText muted>{money(confirmation.subtotal)}</MemberText></View>
      <View style={styles.detailLine}><MemberText muted>Shipping</MemberText><MemberText muted>{money(confirmation.shipping)}</MemberText></View>
      <View style={styles.detailLine}><MemberText role="label">Total</MemberText><MemberText role="label">{money(confirmation.total)}</MemberText></View>
    </View>
    <MemberButton label="Done" onPress={onClose} style={styles.checkoutButton} />
  </View>;
}

function ProductDetailPanel({ product, busy, onClose, onAdd }: { product: NativeStoreProduct; busy: boolean; onClose: () => void; onAdd: (variantId: string) => void }) {
  const firstVariant = primaryVariant(product);
  const [variantId, setVariantId] = useState(firstVariant?.variant_id ?? '');
  const selectedVariant = product.variants.find(variant => variant.variant_id === variantId) ?? firstVariant;
  const unavailable = !selectedVariant || selectedVariant.stock_status === 'out_of_stock';

  return <View style={styles.productDetailPanel}>
    <View style={styles.cartHeader}><MemberText role="sectionTitle">{product.title}</MemberText><Pressable onPress={onClose}><MemberText role="button">Close</MemberText></Pressable></View>
    <ScrollView contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
      {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.detailImage} resizeMode="cover" /> : null}
      {product.description ? <MemberText muted style={styles.detailDescription}>{product.description}</MemberText> : null}
      <MemberText role="label" style={styles.detailHeading}>Choose an option</MemberText>
      <View style={styles.variantList}>
        {product.variants.map(variant => <MemberPill key={variant.variant_id} label={`${variant.label}: ${variant.value}`} selected={variant.variant_id === variantId} onPress={() => setVariantId(variant.variant_id)} />)}
      </View>
      <MemberText role="label" style={styles.detailPrice}>{money(selectedVariant?.price ?? product.price)}</MemberText>
      <MemberButton label={busy ? 'Adding…' : unavailable ? 'Unavailable' : 'Add to cart'} disabled={busy || unavailable} onPress={() => { if (selectedVariant) onAdd(selectedVariant.variant_id); }} style={styles.checkoutButton} />
    </ScrollView>
  </View>;
}

function ProductCard({ product, busy, onAdd, onOpen }: { product: NativeStoreProduct; busy: boolean; onAdd: () => void; onOpen: () => void }) {
  const variant = primaryVariant(product);
  const unavailable = product.stock_status === 'out_of_stock' || !variant;
  return <MemberCard elevated={false} style={styles.productCard}>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View ${product.title}`}>
      {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" /> : <View style={styles.productImagePlaceholder}><MemberText muted>No image</MemberText></View>}
      <MemberText role="label" numberOfLines={2} style={styles.productTitle}>{product.title}</MemberText>
    </Pressable>
    <MemberText role="meta" muted>{money(variant?.price ?? product.price)}</MemberText>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View details for ${product.title}`} style={styles.detailsButton}><MemberText role="button">View details</MemberText></Pressable>
    <MemberButton compact label={busy ? 'Adding…' : unavailable ? 'Unavailable' : 'Add'} disabled={busy || unavailable} onPress={onAdd} style={styles.addButton} />
  </MemberCard>;
}

function CartSummary({ cart, busyVariantId, onClose, onUpdateQuantity, onRemove, onCheckout }: { cart: NativeCartResponse | null; busyVariantId: string | null; onClose: () => void; onUpdateQuantity: (variantId: string, quantity: number) => void; onRemove: (variantId: string) => void; onCheckout: () => void }) {
  return <View style={styles.cartPanel}><View style={styles.cartHeader}><MemberText role="sectionTitle">Your cart</MemberText><Pressable onPress={onClose}><MemberText role="button">Close</MemberText></Pressable></View>{cart?.lines.length ? <>
    {cart.lines.map(line => <View key={line.line_id} style={styles.cartLine}>
      <View style={styles.cartLineCopy}><MemberText>{line.title}</MemberText>{line.variant_label ? <MemberText muted>{line.variant_label}</MemberText> : null}{line.supplier_name ? <MemberText muted>{line.supplier_name}</MemberText> : null}</View>
      <View style={styles.cartLineActions}><View style={styles.quantityControls}><Pressable disabled={busyVariantId === line.variant_id} onPress={() => onUpdateQuantity(line.variant_id, line.quantity - 1)} accessibilityRole="button" accessibilityLabel={`Decrease ${line.title}`} style={styles.quantityButton}><MemberText role="button">−</MemberText></Pressable><MemberText role="label">{line.quantity}</MemberText><Pressable disabled={busyVariantId === line.variant_id} onPress={() => onUpdateQuantity(line.variant_id, line.quantity + 1)} accessibilityRole="button" accessibilityLabel={`Increase ${line.title}`} style={styles.quantityButton}><MemberText role="button">+</MemberText></Pressable></View><MemberText muted>{money(line.line_total)}</MemberText><Pressable disabled={busyVariantId === line.variant_id} onPress={() => onRemove(line.variant_id)} accessibilityRole="button" accessibilityLabel={`Remove ${line.title}`}><MemberText role="button" style={styles.removeLink}>Remove</MemberText></Pressable></View>
    </View>)}
    {cart.shipping_groups?.length ? <View style={styles.shippingGroups}><MemberText role="label">Delivery</MemberText>{cart.shipping_groups.map(group => <View key={group.supplier_key} style={styles.shippingGroup}><View><MemberText muted>{group.supplier_name || group.supplier_key}</MemberText><MemberText muted>{money(group.merchandise_subtotal)}</MemberText></View><MemberText muted>{group.free_shipping ? 'Free' : money(group.shipping_amount)}</MemberText></View>)}</View> : <MemberText muted style={styles.cartNote}>Shipping is calculated using the global supplier and country rules. You’ll confirm the total before payment.</MemberText>}
    <View style={styles.cartTotal}><MemberText role="label">Subtotal</MemberText><MemberText role="label">{money(cart.subtotal)}</MemberText></View><MemberButton label="Checkout" onPress={onCheckout} style={styles.checkoutButton} /></> : <MemberText muted>Your cart is empty.</MemberText>}</View>;
}

function CheckoutPanel({
  address,
  busy,
  error,
  onChange,
  onBack,
  onCheckout,
}: {
  address: ShippingAddressForm;
  busy: boolean;
  error: string | null;
  onChange: (field: keyof ShippingAddressForm, value: string) => void;
  onBack: () => void;
  onCheckout: () => void;
}) {
  const fields: Array<{ field: keyof ShippingAddressForm; label: string; placeholder: string }> = [
    { field: 'first_name', label: 'First name', placeholder: 'First name' },
    { field: 'last_name', label: 'Last name', placeholder: 'Last name' },
    { field: 'line_1', label: 'Address', placeholder: 'Street address' },
    { field: 'city', label: 'City', placeholder: 'City' },
    { field: 'state', label: 'State', placeholder: 'State or region' },
    { field: 'postal_code', label: 'Postcode', placeholder: 'Postcode' },
    { field: 'country_code', label: 'Country code', placeholder: 'AU' },
  ];
  const isComplete = address.first_name.trim() && address.last_name.trim() && address.line_1.trim() && address.city.trim() && address.postal_code.trim() && address.country_code.trim();

  return <View style={styles.checkoutPanel}><View style={styles.cartHeader}><MemberText role="sectionTitle">Delivery details</MemberText><Pressable onPress={onBack}><MemberText role="button">Back</MemberText></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.checkoutContent}>{fields.map(({ field, label, placeholder }) => <View key={field} style={styles.field}><MemberText role="meta" muted>{label}</MemberText><TextInput value={address[field]} onChangeText={value => onChange(field, value)} placeholder={placeholder} placeholderTextColor={memberTheme.colors.textMuted} autoCapitalize={field === 'country_code' ? 'characters' : 'words'} style={styles.fieldInput} /></View>)}{error ? <MemberText muted style={styles.checkoutError}>{error}</MemberText> : null}<MemberButton testID="native-checkout-button" label={busy ? 'Opening payment…' : 'Continue to secure payment'} disabled={busy || !isComplete} onPress={onCheckout} style={styles.checkoutButton} /><MemberText muted style={styles.cartNote}>Payment is processed securely by Stripe. Shipping rates are fixed for now and there are no live carrier quotes.</MemberText></ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: memberTheme.colors.background },
  screenContainer: { flex: 1, paddingHorizontal: storeLayout.screenGutter },
  storeText: { color: memberTheme.colors.text },
  screenTitleText: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  sectionTitleText: { fontSize: 20, lineHeight: 26, fontWeight: '800' },
  bodyText: { fontSize: 15, lineHeight: 22 },
  labelText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  metaText: { fontSize: 12, lineHeight: 18 },
  buttonText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  mutedText: { color: memberTheme.colors.textMuted },
  storeButton: { minHeight: storeLayout.minTouchTarget, paddingHorizontal: memberTheme.spacing.lg, borderRadius: memberTheme.radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryButton: { minHeight: storeLayout.primaryHeight, backgroundColor: memberTheme.colors.primary },
  compactButton: { minHeight: storeLayout.minTouchTarget },
  primaryButtonText: { color: memberTheme.colors.surface },
  disabledButton: { backgroundColor: '#F0F0F4', borderColor: '#A5A5AF' },
  disabledButtonText: { color: '#A5A5AF' },
  statusPill: { minHeight: 40, paddingHorizontal: memberTheme.spacing.md, borderRadius: memberTheme.radius.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  screenContent: { paddingHorizontal: 0 },
  listContent: { paddingBottom: memberTheme.spacing.xxl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: memberTheme.spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: memberTheme.spacing.xl },
  message: { marginTop: memberTheme.spacing.md, textAlign: 'center' },
  shadowNotice: { color: memberTheme.colors.warning, marginTop: memberTheme.spacing.xs },
  headerRow: { paddingHorizontal: storeLayout.screenGutter, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: memberTheme.spacing.lg },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: memberTheme.spacing.sm },
  ordersButton: { borderColor: memberTheme.colors.border, borderWidth: 1, borderRadius: memberTheme.radius.pill, paddingHorizontal: memberTheme.spacing.md, paddingVertical: memberTheme.spacing.sm },
  cartButton: { backgroundColor: memberTheme.colors.primaryDeep, borderRadius: memberTheme.radius.pill, paddingHorizontal: memberTheme.spacing.md, paddingVertical: memberTheme.spacing.sm },
  cartButtonText: { color: memberTheme.colors.surface },
  search: { marginHorizontal: storeLayout.screenGutter, backgroundColor: memberTheme.colors.surface, borderColor: memberTheme.colors.border, borderWidth: 1, borderRadius: memberTheme.radius.pill, paddingHorizontal: memberTheme.spacing.lg, minHeight: storeLayout.primaryHeight, color: memberTheme.colors.ink },
  categoryList: { paddingHorizontal: storeLayout.screenGutter, gap: memberTheme.spacing.sm, paddingVertical: memberTheme.spacing.lg },
  columns: { paddingHorizontal: storeLayout.screenGutter, gap: memberTheme.spacing.md },
  productCard: { flex: 1, padding: memberTheme.spacing.md, marginBottom: memberTheme.spacing.md, minWidth: 0 },
  productImage: { width: '100%', aspectRatio: 1, borderRadius: memberTheme.radius.md, backgroundColor: memberTheme.colors.surfaceSoft, marginBottom: memberTheme.spacing.md },
  productImagePlaceholder: { width: '100%', aspectRatio: 1, borderRadius: memberTheme.radius.md, backgroundColor: memberTheme.colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginBottom: memberTheme.spacing.md },
  productTitle: { minHeight: 36 },
  detailsButton: { paddingVertical: memberTheme.spacing.sm },
  addButton: { marginTop: memberTheme.spacing.sm, width: '100%' },
  emptyProducts: { alignItems: 'center', padding: memberTheme.spacing.xxl },
  inlineError: { marginHorizontal: storeLayout.screenGutter, color: memberTheme.colors.danger },
  cartPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: memberTheme.colors.surface, borderTopLeftRadius: memberTheme.radius.xl, borderTopRightRadius: memberTheme.radius.xl, borderColor: memberTheme.colors.border, borderWidth: 1, padding: memberTheme.spacing.xl, ...memberTheme.shadow },
  productDetailPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90%', backgroundColor: memberTheme.colors.surface, borderTopLeftRadius: memberTheme.radius.xl, borderTopRightRadius: memberTheme.radius.xl, borderColor: memberTheme.colors.border, borderWidth: 1, padding: memberTheme.spacing.xl, ...memberTheme.shadow },
  detailContent: { paddingBottom: memberTheme.spacing.xl },
  detailImage: { width: '100%', aspectRatio: 1, borderRadius: memberTheme.radius.lg, backgroundColor: memberTheme.colors.surfaceSoft, marginBottom: memberTheme.spacing.lg },
  detailDescription: { lineHeight: 20 },
  detailPrice: { fontSize: 20, marginTop: memberTheme.spacing.lg },
  variantList: { flexDirection: 'row', flexWrap: 'wrap', gap: memberTheme.spacing.sm },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: memberTheme.spacing.lg },
  cartLine: { flexDirection: 'row', justifyContent: 'space-between', gap: memberTheme.spacing.md, paddingVertical: memberTheme.spacing.sm, borderBottomColor: memberTheme.colors.border, borderBottomWidth: 1 },
  cartLineCopy: { flex: 1, gap: memberTheme.spacing.xs },
  cartLineActions: { alignItems: 'flex-end', gap: memberTheme.spacing.xs },
  quantityControls: { alignItems: 'center', flexDirection: 'row', gap: memberTheme.spacing.sm },
  quantityButton: { alignItems: 'center', borderColor: memberTheme.colors.border, borderRadius: memberTheme.radius.pill, borderWidth: 1, height: storeLayout.minTouchTarget, justifyContent: 'center', width: storeLayout.minTouchTarget },
  removeLink: { color: memberTheme.colors.danger },
  shippingGroups: { borderTopColor: memberTheme.colors.border, borderTopWidth: 1, marginTop: memberTheme.spacing.lg, paddingTop: memberTheme.spacing.md },
  shippingGroup: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: memberTheme.spacing.sm },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: memberTheme.spacing.lg },
  cartNote: { marginTop: memberTheme.spacing.md },
  noticePanel: { position: 'absolute', left: memberTheme.spacing.lg, right: memberTheme.spacing.lg, top: memberTheme.spacing.lg, zIndex: 10, backgroundColor: memberTheme.colors.surfaceSoft, borderColor: memberTheme.colors.border, borderRadius: memberTheme.radius.md, borderWidth: 1, flexDirection: 'row', gap: memberTheme.spacing.md, justifyContent: 'space-between', padding: memberTheme.spacing.md },
  noticeCopy: { flex: 1 },
  confirmationPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: memberTheme.colors.surface, borderTopLeftRadius: memberTheme.radius.xl, borderTopRightRadius: memberTheme.radius.xl, borderColor: memberTheme.colors.border, borderWidth: 1, padding: memberTheme.spacing.xl, ...memberTheme.shadow },
  confirmationNumber: { fontSize: 20, marginTop: memberTheme.spacing.sm },
  checkoutButton: { marginTop: memberTheme.spacing.lg, width: '100%' },
  checkoutPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', backgroundColor: memberTheme.colors.surface, borderTopLeftRadius: memberTheme.radius.xl, borderTopRightRadius: memberTheme.radius.xl, borderColor: memberTheme.colors.border, borderWidth: 1, padding: memberTheme.spacing.xl, ...memberTheme.shadow },
  checkoutContent: { paddingBottom: memberTheme.spacing.xl },
  field: { marginBottom: memberTheme.spacing.md },
  fieldInput: { marginTop: memberTheme.spacing.xs, backgroundColor: memberTheme.colors.surface, borderColor: memberTheme.colors.border, borderWidth: 1, borderRadius: memberTheme.radius.md, minHeight: storeLayout.primaryHeight, paddingHorizontal: memberTheme.spacing.md, color: memberTheme.colors.ink },
  checkoutError: { marginTop: memberTheme.spacing.md, color: memberTheme.colors.danger },
  ordersPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', backgroundColor: memberTheme.colors.surface, borderTopLeftRadius: memberTheme.radius.xl, borderTopRightRadius: memberTheme.radius.xl, borderColor: memberTheme.colors.border, borderWidth: 1, padding: memberTheme.spacing.xl, ...memberTheme.shadow },
  panelActions: { flexDirection: 'row', gap: memberTheme.spacing.lg },
  ordersContent: { paddingBottom: memberTheme.spacing.xl },
  ordersLoading: { alignItems: 'center', gap: memberTheme.spacing.md, paddingVertical: memberTheme.spacing.xl },
  ordersEmpty: { alignItems: 'center', paddingVertical: memberTheme.spacing.xxl },
  orderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: memberTheme.spacing.md, borderBottomColor: memberTheme.colors.border, borderBottomWidth: 1, paddingVertical: memberTheme.spacing.lg },
  orderRowCopy: { flex: 1, gap: memberTheme.spacing.xs },
  orderPills: { flexDirection: 'row', flexWrap: 'wrap', gap: memberTheme.spacing.xs, marginTop: memberTheme.spacing.xs },
  orderSummary: { paddingBottom: memberTheme.spacing.lg, borderBottomColor: memberTheme.colors.border, borderBottomWidth: 1, gap: memberTheme.spacing.sm },
  orderTotal: { fontSize: 20, marginTop: memberTheme.spacing.sm },
  detailHeading: { marginTop: memberTheme.spacing.xl, marginBottom: memberTheme.spacing.sm },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: memberTheme.spacing.md, paddingVertical: memberTheme.spacing.sm },
  fulfillmentCard: { backgroundColor: memberTheme.colors.surfaceSoft, borderRadius: memberTheme.radius.md, padding: memberTheme.spacing.md, marginBottom: memberTheme.spacing.sm, gap: memberTheme.spacing.sm },
  fulfillmentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: memberTheme.spacing.sm },
  trackingLink: { color: memberTheme.colors.primaryInk },
  orderTotals: { borderTopColor: memberTheme.colors.border, borderTopWidth: 1, marginTop: memberTheme.spacing.lg, paddingTop: memberTheme.spacing.sm },
});
