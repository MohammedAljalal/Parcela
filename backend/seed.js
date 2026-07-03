// Seeds the database with realistic demo data covering every model, so the
// admin dashboard and mobile app have something meaningful to display right
// after a fresh install. Run with: node seed.js
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const {
  Island,
  Category,
  User,
  Product,
  Address,
  Cart,
  Coupon,
  Banner,
  OtpLog,
  Notification,
  Wishlist,
  Order,
  Review,
} = require('./src/models');
const generateOrderNumber = require('./src/validators/generateOrderNumber');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      Island.deleteMany({}),
      Category.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
      Address.deleteMany({}),
      Cart.deleteMany({}),
      Coupon.deleteMany({}),
      Banner.deleteMany({}),
      OtpLog.deleteMany({}),
      Notification.deleteMany({}),
      Wishlist.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // ── Islands ──────────────────────────────────────────────────────────────
    const island = await Island.create({
      name: 'Santiago',
      code: 'STI',
      region: 'Sotavento',
      capital: 'Praia',
      deliveryFee: 500,
      estimatedDeliveryDays: { min: 1, max: 2 },
      isActive: true,
      sortOrder: 1,
    });
    const islandSaoVicente = await Island.create({
      name: 'São Vicente',
      code: 'SVI',
      region: 'Barlavento',
      capital: 'Mindelo',
      deliveryFee: 600,
      estimatedDeliveryDays: { min: 2, max: 4 },
      isActive: true,
      sortOrder: 2,
    });
    await Island.create({
      name: 'Sal',
      code: 'SAL',
      region: 'Barlavento',
      capital: 'Espargos',
      deliveryFee: 700,
      estimatedDeliveryDays: { min: 2, max: 5 },
      isActive: true,
      sortOrder: 3,
    });
    await Island.create({
      name: 'Boa Vista',
      code: 'BVC',
      region: 'Barlavento',
      capital: 'Sal Rei',
      deliveryFee: 700,
      estimatedDeliveryDays: { min: 2, max: 5 },
      isActive: true,
      sortOrder: 4,
    });
    await Island.create({
      name: 'Fogo',
      code: 'FOG',
      region: 'Sotavento',
      capital: 'São Filipe',
      deliveryFee: 550,
      estimatedDeliveryDays: { min: 2, max: 4 },
      isActive: true,
      sortOrder: 5,
    });
    console.log('Seeded islands');

    // ── Categories ───────────────────────────────────────────────────────────
    const catModa = await Category.create({
      name: { pt: 'Moda', en: 'Fashion' },
      icon: '👗',
      image: 'https://images.unsplash.com/photo-1574634534894-89d7576c8d59?w=800&q=80',
      isActive: true,
      sortOrder: 1,
    });
    const catEletronicos = await Category.create({
      name: { pt: 'Eletrónicos', en: 'Electronics' },
      icon: '📱',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
      isActive: true,
      sortOrder: 2,
    });
    const catCasa = await Category.create({
      name: { pt: 'Casa', en: 'Home' },
      icon: '🏠',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      isActive: true,
      sortOrder: 3,
    });
    const catMercearia = await Category.create({
      name: { pt: 'Mercearia', en: 'Grocery' },
      icon: '🛒',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      isActive: true,
      sortOrder: 4,
    });
    await Category.create({
      name: { pt: 'Saúde & Beleza', en: 'Health & Beauty' },
      icon: '💄',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
      isActive: true,
      sortOrder: 5,
    });
    await Category.create({
      name: { pt: 'Livros', en: 'Books' },
      icon: '📚',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80',
      isActive: true,
      sortOrder: 6,
    });
    // A subcategory, to exercise the parent/child hierarchy in the dashboard.
    await Category.create({
      name: { pt: 'Smartphones', en: 'Smartphones' },
      icon: '📲',
      parent: catEletronicos._id,
      isActive: true,
      sortOrder: 1,
    });
    console.log('Seeded categories');

    // ── Users ────────────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@parcela.cv',
      phone: '+2389123456',
      password: 'password123',
      role: 'admin',
      emailVerified: true,
      isVerified: true,
    });

    const vendor = await User.create({
      name: 'Tech Store CV',
      email: 'vendor@parcela.cv',
      phone: '+2389123457',
      password: 'password123',
      role: 'vendor',
      emailVerified: true,
      isVerified: true,
    });

    const customer = await User.create({
      name: 'Mohammed Silva',
      email: 'customer@parcela.cv',
      phone: '+2389999999',
      password: 'password123',
      role: 'customer',
      emailVerified: true,
      isVerified: true,
    });

    const customer2 = await User.create({
      name: 'Ana Pereira',
      email: 'ana@parcela.cv',
      phone: '+2389888888',
      password: 'password123',
      role: 'customer',
      emailVerified: true,
      isVerified: true,
    });
    console.log('Seeded users (admin / vendor / 2 customers — password123 for all)');

    // ── Products ─────────────────────────────────────────────────────────────
    const p1 = await Product.create({
      name: { pt: 'Relógio Digital Series X', en: 'Digital Watch Series X' },
      description: { pt: 'Relógio inteligente com monitor cardíaco e GPS.' },
      category: catEletronicos._id,
      price: 4200,
      stock: 15,
      sku: 'WATCH-X-001',
      images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', isPrimary: true }],
      vendor: vendor._id,
      vendorInfo: { storeName: 'Tech Store CV' },
      availableIslands: [island._id, islandSaoVicente._id],
      isActive: true,
      isFeatured: true,
    });

    const p2 = await Product.create({
      name: { pt: 'Sapatilhas Sport Red', en: 'Sport Sneakers Red' },
      description: { pt: 'Sapatilhas confortáveis para o dia a dia.' },
      category: catModa._id,
      price: 6500,
      stock: 8,
      sku: 'SHOE-RED-002',
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', isPrimary: true }],
      vendor: vendor._id,
      vendorInfo: { storeName: 'Shoe Store' },
      isActive: true,
    });

    const p3 = await Product.create({
      name: { pt: 'Auscultadores Studio Pro', en: 'Studio Pro Headphones' },
      description: { pt: 'Som de alta qualidade com cancelamento de ruído.' },
      category: catEletronicos._id,
      price: 8900,
      stock: 12,
      sku: 'AUDIO-003',
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', isPrimary: true }],
      vendor: vendor._id,
      vendorInfo: { storeName: 'Audio Shop' },
      isActive: true,
      isFeatured: true,
    });

    const p4 = await Product.create({
      name: { pt: 'Ténis Classic Canvas', en: 'Classic Canvas Sneakers' },
      category: catModa._id,
      price: 2450,
      compareAtPrice: 3500,
      isPromoted: true,
      stock: 20,
      sku: 'SHOE-004',
      images: [{ url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80', isPrimary: true }],
      vendor: vendor._id,
      vendorInfo: { storeName: 'Shoe Store' },
      isActive: true,
    });

    const p5 = await Product.create({
      name: { pt: 'Arroz Premium 5kg', en: 'Premium Rice 5kg' },
      category: catMercearia._id,
      price: 850,
      stock: 2,
      sku: 'GROC-005',
      images: [{ url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80', isPrimary: true }],
      vendor: vendor._id,
      vendorInfo: { storeName: 'Mercado Central' },
      isActive: true,
    });
    console.log('Seeded products (including one low-stock item for dashboard alerts)');

    // ── Addresses ────────────────────────────────────────────────────────────
    const address = await Address.create({
      user: customer._id,
      label: 'Casa',
      recipient: 'Mohammed Silva',
      phone: '+2389999999',
      address: 'Rua Principal, 123',
      city: 'Praia',
      island: island._id,
      isDefault: true,
    });
    await Address.create({
      user: customer2._id,
      label: 'Trabalho',
      recipient: 'Ana Pereira',
      phone: '+2389888888',
      address: 'Avenida Cidade Velha, 45',
      city: 'Mindelo',
      island: islandSaoVicente._id,
      isDefault: true,
    });
    console.log('Seeded addresses');

    // ── Cart (customer2 has items still in cart, never checked out) ───────────
    await Cart.create({
      user: customer2._id,
      items: [{ product: p3._id, quantity: 1, price: p3.price }],
      deliveryIsland: islandSaoVicente._id,
    });
    console.log('Seeded cart');

    // ── Coupons ──────────────────────────────────────────────────────────────
    await Coupon.create({
      code: 'PROMO10',
      type: 'percentage',
      value: 10,
      maxDiscount: 1000,
      minOrderAmount: 1000,
      usageLimit: 100,
      usagePerUser: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      description: { pt: 'Desconto de 10% em todo o site' },
    });
    await Coupon.create({
      code: 'FRETEGRATIS',
      type: 'free_delivery',
      value: 0,
      usageLimit: 0,
      usagePerUser: 1,
      isActive: true,
      description: { pt: 'Entrega gratuita' },
    });
    console.log('Seeded coupons');

    // ── Banners ──────────────────────────────────────────────────────────────
    await Banner.create({
      title: { pt: 'ESPECIAL SANTIAGO', en: 'SANTIAGO SPECIAL' },
      subtitle: { pt: 'Entregas Gratuitas em Praia', en: 'Free delivery in Praia' },
      ctaLabel: { pt: 'Comprar Agora', en: 'Shop Now' },
      image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
      island: island._id,
      isActive: true,
      sortOrder: 1,
    });
    await Banner.create({
      title: { pt: 'Novidades em Eletrónicos', en: 'New in Electronics' },
      subtitle: { pt: 'Até 30% de desconto', en: 'Up to 30% off' },
      ctaLabel: { pt: 'Ver Mais', en: 'See More' },
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
      isActive: true,
      sortOrder: 2,
    });
    console.log('Seeded banners');

    // ── OTP logs (one normal, one blocked — to exercise the security page) ────
    await OtpLog.create({
      identifier: '+2389999999',
      attempts: 1,
      lastSentAt: new Date(),
    });
    await OtpLog.create({
      identifier: '+2381112222',
      attempts: 6,
      lastSentAt: new Date(),
      blockedUntil: new Date(Date.now() + 60 * 60 * 1000),
    });
    console.log('Seeded OTP logs');

    // ── Wishlist ─────────────────────────────────────────────────────────────
    await Wishlist.create({
      user: customer._id,
      products: [{ product: p1._id }, { product: p3._id }],
    });
    console.log('Seeded wishlist');

    // ── Orders (one delivered, one pending — to populate dashboard charts) ────
    const deliveredOrder = await Order.create({
      orderNumber: generateOrderNumber(),
      user: customer._id,
      items: [
        { product: p1._id, name: 'Relógio Digital Series X', price: 4200, quantity: 1, vendorStoreName: 'Tech Store CV' },
      ],
      deliveryIsland: island._id,
      deliveryAddress: {
        recipient: address.recipient,
        phone: address.phone,
        address: address.address,
        city: address.city,
      },
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'paid',
      status: 'delivered',
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 3 * 86400000) },
        { status: 'paid', timestamp: new Date(Date.now() - 3 * 86400000) },
        { status: 'shipped', timestamp: new Date(Date.now() - 2 * 86400000) },
        { status: 'delivered', timestamp: new Date(Date.now() - 1 * 86400000) },
      ],
      deliveredAt: new Date(Date.now() - 1 * 86400000),
      subtotal: 4200,
      deliveryFee: 500,
      total: 4700,
    });

    await Order.create({
      orderNumber: generateOrderNumber(),
      user: customer2._id,
      items: [
        { product: p4._id, name: 'Ténis Classic Canvas', price: 2450, quantity: 2, vendorStoreName: 'Shoe Store' },
      ],
      deliveryIsland: islandSaoVicente._id,
      deliveryAddress: {
        recipient: 'Ana Pereira',
        phone: '+2389888888',
        address: 'Avenida Cidade Velha, 45',
        city: 'Mindelo',
      },
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
      subtotal: 4900,
      deliveryFee: 600,
      total: 5500,
    });
    console.log('Seeded orders');

    // ── Notifications ────────────────────────────────────────────────────────
    await Notification.create({
      user: customer._id,
      title: { pt: 'Bem-vindo ao Parcela!', en: 'Welcome to Parcela!' },
      body: { pt: 'Obrigado por se juntar a nós.', en: 'Thanks for joining us.' },
      type: 'system',
    });
    await Notification.create({
      user: customer._id,
      title: { pt: 'Pedido entregue', en: 'Order delivered' },
      body: { pt: `O seu pedido ${deliveredOrder.orderNumber} foi entregue.` },
      type: 'order_update',
      data: { orderId: deliveredOrder._id.toString() },
    });
    console.log('Seeded notifications');

    // ── Review (tied to the delivered order, as required by the schema) ───────
    await Review.create({
      user: customer._id,
      product: p1._id,
      order: deliveredOrder._id,
      rating: 5,
      comment: 'Excelente produto, recomendo!',
      isVerifiedPurchase: true,
    });
    console.log('Seeded review');

    console.log('\nAll models seeded successfully!');
    console.log('\nLogin credentials (all use password: password123):');
    console.log(`  Admin:    ${admin.email}`);
    console.log(`  Vendor:   ${vendor.email}`);
    console.log(`  Customer: ${customer.email}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedDB();
