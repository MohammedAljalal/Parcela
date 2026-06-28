require('dotenv').config();
const mongoose = require('mongoose');
const { Island, Category, User, Product, Address, Cart, Coupon, Banner, OtpLog, Notification, Wishlist, Order, Review } = require('./src/models');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean all collections
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
      Review.deleteMany({})
    ]);
    console.log('Cleared existing data');

    const island = await Island.create({
      name: 'Santiago',
      code: 'ST',
      deliveryFee: 500,
      isActive: true,
    });
    await Island.create({ name: 'São Vicente', code: 'SV', deliveryFee: 600, isActive: true });
    await Island.create({ name: 'Sal', code: 'SL', deliveryFee: 700, isActive: true });
    await Island.create({ name: 'Boa Vista', code: 'BV', deliveryFee: 700, isActive: true });
    await Island.create({ name: 'Fogo', code: 'FG', deliveryFee: 550, isActive: true });
    const catModa = await Category.create({ name: { pt: 'Moda', en: 'Fashion' }, description: { pt: '4.2k Produtos' }, isFeatured: true, image: 'https://images.unsplash.com/photo-1574634534894-89d7576c8d59?w=800&q=80', isActive: true });
    const catEletronicos = await Category.create({ name: { pt: 'Eletrónicos', en: 'Electronics' }, description: { pt: '850 Produtos' }, isFeatured: false, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80', isActive: true });
    const catCasa = await Category.create({ name: { pt: 'Casa', en: 'Home' }, description: { pt: '1.1k Produtos' }, isFeatured: false, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', isActive: true });
    const catMercearia = await Category.create({ name: { pt: 'Mercearia', en: 'Grocery' }, description: { pt: 'Disponível agora' }, badge: { pt: 'Fresco' }, isFeatured: true, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80', isActive: true });
    const catSaude = await Category.create({ name: { pt: 'Saúde & Beleza', en: 'Health & Beauty' }, description: { pt: '600+ Marcas' }, isFeatured: false, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', isActive: true });
    const catLivros = await Category.create({ name: { pt: 'Livros', en: 'Books' }, description: { pt: '2.5k Títulos' }, isFeatured: false, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80', isActive: true });
    const user = await User.create({
      name: 'Admin User',
      email: 'admin@parcela.com',
      phone: '+2389123456',
      password: 'password123',
      role: 'admin',
      emailVerified: true,
      isVerified: true,
    });

    const customer = await User.create({
      name: 'Mohammed',
      email: 'customer@parcela.com',
      phone: '+2389999999',
      password: 'password123',
      role: 'customer',
      emailVerified: true,
      isVerified: true,
    });

    const p1 = await Product.create({
      name: { pt: 'Relógio Digital Series X' },
      category: catEletronicos._id,
      price: 4200,
      stock: 15,
      images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', isPrimary: true }],
      vendorInfo: { storeName: 'Tech Store' },
      isActive: true,
    });

    const p2 = await Product.create({
      name: { pt: 'Sapatilhas Sport Red' },
      category: catModa._id,
      price: 6500,
      stock: 8,
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', isPrimary: true }],
      vendorInfo: { storeName: 'Shoe Store' },
      isActive: true,
    });

    const p3 = await Product.create({
      name: { pt: 'Headphones Studio...' },
      category: catEletronicos._id,
      price: 8900,
      stock: 12,
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', isPrimary: true }],
      vendorInfo: { storeName: 'Audio Shop' },
      isActive: true,
    });

    const p4 = await Product.create({
      name: { pt: 'Classic Canvas High' },
      category: catModa._id,
      price: 2450,
      compareAtPrice: 3500,
      isPromoted: true,
      stock: 20,
      images: [{ url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80', isPrimary: true }],
      vendorInfo: { storeName: 'Shoe Store' },
      isActive: true,
    });

    const address = await Address.create({
      user: customer._id,
      recipient: 'Mohammed',
      phone: '+2389999999',
      address: 'Rua Principal, 123',
      city: 'Praia',
      island: island._id,
    });

    const cart = await Cart.create({
      user: customer._id,
      items: [{ product: p1._id, quantity: 1, price: p1.price }, { product: p2._id, quantity: 1, price: p2.price }],
      total: p1.price + p2.price,
    });

    const coupon = await Coupon.create({
      code: 'PROMO10',
      type: 'percentage', 
      value: 10,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      description: { pt: 'Desconto de 10%' },
    });

    const banner = await Banner.create({
      title: { pt: 'ESPECIAL SANTIAGO' },
      subtitle: { pt: 'Entregas Gratuitas em Praia' },
      ctaLabel: { pt: 'Comprar Agora' },
      image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
      isActive: true,
    });

    const otpLog = await OtpLog.create({
      identifier: '+2389999999',
      otp: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const notification = await Notification.create({
      user: customer._id,
      title: { pt: 'Bem-vindo ao Parcela!', en: 'Welcome to Parcela!' },
      body: { pt: 'Test msg' },
      type: 'system', 
    });

    const wishlist = await Wishlist.create({
      user: customer._id,
      products: [{ product: p1._id }],
    });

    const order = await Order.create({
      orderId: 'ORD-' + Date.now(),
      user: customer._id,
      items: [{ product: p1._id, name: 'Relógio Digital Series X', price: 4200, quantity: 1 }],
      status: 'pending', 
      deliveryIsland: island._id,
      deliveryAddress: {
        recipient: 'Mohammed',
        phone: '+2389999999',
        address: 'Rua Principal, 123',
        city: 'Praia',
      },
      paymentMethod: 'cash_on_delivery',
      subtotal: 4200,
      deliveryFee: 500,
      total: 4700,
    });

    const review = await Review.create({
      user: customer._id,
      product: p1._id,
      order: order._id,
      rating: 5,
      title: 'Excellent',
      comment: 'Very good product!',
      isVerifiedPurchase: true,
    });

    console.log('All models seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
