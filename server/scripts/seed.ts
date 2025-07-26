import mongoose from "mongoose";
import User from "../models/User";
import Category from "../models/Category";
import Product from "../models/Product";
import connectDB from "../config/database";

const seedData = async () => {
  try {
    console.log("🌱 Starting Kiti Locks kitchen hardware database seed...");

    // Connect to database
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log("🧹 Cleared existing data");

    // Create admin user
    const adminUser = new User({
      name: "Pradeep Kumar Khuntia",
      email: "admin@kitilocks.com",
      password: "Admin123!",
      role: "admin",
    });
    await adminUser.save();

    // Create regular user
    const regularUser = new User({
      name: "John Smith",
      email: "john@example.com",
      password: "Password123!",
      role: "user",
    });
    await regularUser.save();

    console.log("👥 Created users");

    // Create Kiti Locks product categories
    const categories = [
      {
        name: "Soft Close Hinges",
        slug: "soft-close-hinges",
        description:
          "Premium soft-close hinges available in multiple cup sizes for modern cabinets with silent operation",
        featured: true,
        sortOrder: 1,
      },
      {
        name: "Telescopic & Soft Close Channels",
        slug: "telescopic-soft-close-channels",
        description:
          "High load capacity telescopic channels and smooth soft-close drawer systems",
        featured: true,
        sortOrder: 2,
      },
      {
        name: "Drawer Systems",
        slug: "drawer-systems",
        description:
          "Modular boxes and premium tandem box systems for modern kitchen drawers",
        featured: true,
        sortOrder: 3,
      },
      {
        name: "Lift-Up Systems",
        slug: "lift-up-systems",
        description:
          "AVENTOS series space-saving lift-up cabinet solutions inspired by international designs",
        featured: true,
        sortOrder: 4,
      },
      {
        name: "Wardrobe & Sliding Accessories",
        slug: "wardrobe-sliding-accessories",
        description:
          "Aluminium sliding systems, locking systems, hinges and catchers for wardrobes",
        featured: true,
        sortOrder: 5,
      },
      {
        name: "Designer Handles & Accessories",
        slug: "designer-handles-accessories",
        description:
          "Handles, knobs, PVC legs, pull-out baskets, detergent holders and SS dish racks",
        featured: true,
        sortOrder: 6,
      },
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log("📁 Created Kiti Locks product categories");

    // Create Kiti Locks catalog products
    const products = [
      // Soft Close Hinges Category
      {
        name: "KITI SOFT CLOSE HINGES - 8MM CUP",
        slug: "kiti-soft-close-hinges-8mm-cup",
        description:
          "Premium soft-close hinges with 8mm cup size for modern cabinets. Features silent operation, multiple overlay types, and durable construction for long-lasting performance.",
        price: 299.99,
        comparePrice: 399.99,
        category: createdCategories[0]._id,
        tags: [
          "soft-close",
          "8mm-cup",
          "silent-operation",
          "cabinet-hinges",
          "overlay",
        ],
        variants: [
          { name: "Cup Size", value: "8mm", stock: 50 },
          { name: "Overlay Type", value: "Full Overlay", stock: 30 },
          { name: "Overlay Type", value: "Half Overlay", stock: 25 },
          { name: "Overlay Type", value: "Inset", stock: 15 },
        ],
        images: [
          "https://cdn.builder.io/api/v1/image/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2F216348e089384657a97cb63a6d31f3d3?format=webp&width=800",
        ],
        stock: 70,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-HG08",
        usageArea: "Kitchen",
        finish: "Chrome",
        seo: {
          title: "KITI SOFT CLOSE HINGES 8MM - Premium Cabinet Hardware",
          description:
            "Shop premium 8mm soft-close hinges with silent operation. Perfect for modern kitchen cabinets.",
        },
      },
      {
        name: "KITI SOFT CLOSE HINGES - 9MM CUP",
        slug: "kiti-soft-close-hinges-9mm-cup",
        description:
          "Premium soft-close hinges with 9mm cup size designed for modern cabinet doors. Superior engineering ensures silent closing and long-lasting durability.",
        price: 329.99,
        comparePrice: 429.99,
        category: createdCategories[0]._id,
        tags: [
          "soft-close",
          "9mm-cup",
          "silent-operation",
          "cabinet-hinges",
          "premium",
        ],
        variants: [
          { name: "Cup Size", value: "9mm", stock: 45 },
          { name: "Overlay Type", value: "Full Overlay", stock: 28 },
          { name: "Overlay Type", value: "Half Overlay", stock: 22 },
        ],
        images: [
          "https://cdn.builder.io/api/v1/image/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2F216348e089384657a97cb63a6d31f3d3?format=webp&width=800",
        ],
        stock: 50,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-HG09",
        usageArea: "Kitchen",
        finish: "Chrome",
        seo: {
          title: "KITI SOFT CLOSE HINGES 9MM - Premium Cabinet Hardware",
          description:
            "Shop premium 9mm soft-close hinges with superior engineering. Ideal for kitchen cabinets.",
        },
      },
      {
        name: "KITI SOFT CLOSE HINGES - 10MM CUP",
        slug: "kiti-soft-close-hinges-10mm-cup",
        description:
          "Heavy-duty soft-close hinges with 10mm cup size for demanding applications. Built for frequent use with smooth, silent operation.",
        price: 359.99,
        comparePrice: 459.99,
        category: createdCategories[0]._id,
        tags: [
          "soft-close",
          "10mm-cup",
          "heavy-duty",
          "silent-operation",
          "frequent-use",
        ],
        variants: [
          { name: "Cup Size", value: "10mm", stock: 40 },
          { name: "Load Capacity", value: "15kg", stock: 25 },
          { name: "Load Capacity", value: "20kg", stock: 20 },
        ],
        images: [
          "https://cdn.builder.io/api/v1/image/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2F216348e089384657a97cb63a6d31f3d3?format=webp&width=800",
        ],
        stock: 45,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-HG10",
        usageArea: "Kitchen",
        finish: "Chrome",
      },
      {
        name: "KITI SOFT CLOSE HINGES - 14MM CUP",
        slug: "kiti-soft-close-hinges-14mm-cup",
        description:
          "Extra heavy-duty soft-close hinges with 14mm cup size for maximum load capacity. Perfect for large cabinet doors and heavy-duty applications.",
        price: 429.99,
        comparePrice: 549.99,
        category: createdCategories[0]._id,
        tags: [
          "soft-close",
          "14mm-cup",
          "extra-heavy-duty",
          "maximum-load",
          "large-doors",
        ],
        variants: [
          { name: "Cup Size", value: "14mm", stock: 35 },
          { name: "Load Capacity", value: "25kg", stock: 20 },
          { name: "Load Capacity", value: "30kg", stock: 15 },
        ],
        images: [
          "https://cdn.builder.io/api/v1/image/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2F216348e089384657a97cb63a6d31f3d3?format=webp&width=800",
        ],
        stock: 35,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-HG14",
        usageArea: "Kitchen",
        finish: "Chrome",
      },

      // Telescopic & Soft Close Channels Category
      {
        name: "KITI TELESCOPIC CHANNEL - 45MM",
        slug: "kiti-telescopic-channel-45mm",
        description:
          "High load capacity telescopic channels with 45mm width. Rust-free finish ensures smooth operation and long-lasting performance for kitchen drawers.",
        price: 459.99,
        comparePrice: 599.99,
        category: createdCategories[1]._id,
        tags: [
          "telescopic",
          "45mm",
          "high-load",
          "rust-free",
          "smooth-operation",
        ],
        variants: [
          { name: "Length", value: "300mm", stock: 30 },
          { name: "Length", value: "400mm", stock: 35 },
          { name: "Length", value: "500mm", stock: 40 },
          { name: "Load Capacity", value: "35kg", stock: 45 },
        ],
        images: [
          "https://cdn.builder.io/o/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2Fab554d2784d6441895a76128a53b73f7?alt=media&token=5cfd3744-46f6-4344-b766-9f601f28093e&apiKey=5e5f4ac77c06444f8f717e1bc330983c",
        ],
        stock: 50,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-TC45",
        usageArea: "Drawer",
        finish: "SS",
      },
      {
        name: "KITI TELESCOPIC CHANNEL - 50MM",
        slug: "kiti-telescopic-channel-50mm",
        description:
          "Heavy-duty telescopic channels with 50mm width for maximum load capacity. Professional grade construction with rust-free finish.",
        price: 529.99,
        comparePrice: 689.99,
        category: createdCategories[1]._id,
        tags: [
          "telescopic",
          "50mm",
          "heavy-duty",
          "maximum-load",
          "professional-grade",
        ],
        variants: [
          { name: "Length", value: "400mm", stock: 25 },
          { name: "Length", value: "500mm", stock: 30 },
          { name: "Length", value: "600mm", stock: 35 },
          { name: "Load Capacity", value: "45kg", stock: 40 },
        ],
        images: [
          "https://cdn.builder.io/o/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2Fab554d2784d6441895a76128a53b73f7?alt=media&token=5cfd3744-46f6-4344-b766-9f601f28093e&apiKey=5e5f4ac77c06444f8f717e1bc330983c",
        ],
        stock: 45,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-TC50",
        usageArea: "Drawer",
        finish: "SS",
      },
      {
        name: "KITI SOFT CLOSE CHANNEL - INBUILT",
        slug: "kiti-soft-close-channel-inbuilt",
        description:
          "Premium soft-close channels with inbuilt damping mechanism. Smooth drawer closing with long-lasting performance for modern kitchen applications.",
        price: 729.99,
        comparePrice: 949.99,
        category: createdCategories[1]._id,
        tags: [
          "soft-close",
          "inbuilt",
          "damping-mechanism",
          "smooth-closing",
          "premium",
        ],
        variants: [
          { name: "Type", value: "Inbuilt", stock: 35 },
          { name: "Length", value: "450mm", stock: 25 },
          { name: "Length", value: "550mm", stock: 30 },
          { name: "Load Capacity", value: "40kg", stock: 35 },
        ],
        images: [
          "https://cdn.builder.io/o/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2Fab554d2784d6441895a76128a53b73f7?alt=media&token=5cfd3744-46f6-4344-b766-9f601f28093e&apiKey=5e5f4ac77c06444f8f717e1bc330983c",
        ],
        stock: 40,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-SCI",
        usageArea: "Drawer",
        finish: "SS",
      },
      {
        name: "KITI SOFT CLOSE CHANNEL - EXTERNAL",
        slug: "kiti-soft-close-channel-external",
        description:
          "External soft-close channels with adjustable damping. Easy installation and maintenance with reliable soft-close performance.",
        price: 649.99,
        comparePrice: 849.99,
        category: createdCategories[1]._id,
        tags: [
          "soft-close",
          "external",
          "adjustable-damping",
          "easy-installation",
          "reliable",
        ],
        variants: [
          { name: "Type", value: "External", stock: 40 },
          { name: "Length", value: "400mm", stock: 30 },
          { name: "Length", value: "500mm", stock: 35 },
          { name: "Adjustment", value: "Yes", stock: 45 },
        ],
        images: [
          "https://cdn.builder.io/o/assets%2F5e5f4ac77c06444f8f717e1bc330983c%2Fab554d2784d6441895a76128a53b73f7?alt=media&token=5cfd3744-46f6-4344-b766-9f601f28093e&apiKey=5e5f4ac77c06444f8f717e1bc330983c",
        ],
        stock: 50,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-SCE",
        usageArea: "Drawer",
        finish: "SS",
      },

      // Drawer Systems Category
      {
        name: "MODULAR BOX - SOFT CLOSE",
        slug: "modular-box-soft-close",
        description:
          "Premium modular box system with integrated soft-close mechanism. Complete drawer solution with smooth operation and modern aesthetics.",
        price: 1199.99,
        comparePrice: 1549.99,
        category: createdCategories[2]._id,
        tags: [
          "modular-box",
          "soft-close",
          "integrated",
          "complete-solution",
          "modern",
        ],
        variants: [
          { name: "Height", value: "100mm", stock: 25 },
          { name: "Height", value: "150mm", stock: 30 },
          { name: "Height", value: "200mm", stock: 35 },
          { name: "Width", value: "450mm", stock: 40 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 45,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-MBSC",
        usageArea: "Drawer",
        finish: "Matte",
      },
      {
        name: "MODULAR BOX - NON-SOFT CLOSE",
        slug: "modular-box-non-soft-close",
        description:
          "Standard modular box system for cost-effective drawer solutions. Reliable performance with easy installation for budget-conscious projects.",
        price: 899.99,
        comparePrice: 1199.99,
        category: createdCategories[2]._id,
        tags: [
          "modular-box",
          "non-soft-close",
          "cost-effective",
          "reliable",
          "budget-friendly",
        ],
        variants: [
          { name: "Height", value: "100mm", stock: 30 },
          { name: "Height", value: "150mm", stock: 35 },
          { name: "Width", value: "400mm", stock: 40 },
          { name: "Width", value: "500mm", stock: 45 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 50,
        featured: false,
        operationType: "Non-Soft Close",
        productCode: "KITI-MBNSC",
        usageArea: "Drawer",
        finish: "Matte",
      },
      {
        name: "PREMIUM TANDEM BOX - SOFT CLOSE INTERNAL",
        slug: "premium-tandem-box-soft-close-internal",
        description:
          "Premium tandem box system with internal soft-close mechanism. High-end drawer solution with superior build quality and performance.",
        price: 1649.99,
        comparePrice: 2149.99,
        category: createdCategories[2]._id,
        tags: ["premium", "tandem-box", "soft-close", "internal", "high-end"],
        variants: [
          { name: "Type", value: "Internal", stock: 20 },
          { name: "Height", value: "120mm", stock: 25 },
          { name: "Height", value: "180mm", stock: 30 },
          { name: "Load Capacity", value: "50kg", stock: 35 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 35,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-PTBSCI",
        usageArea: "Drawer",
        finish: "Premium",
      },
      {
        name: "PREMIUM TANDEM BOX - SOFT CLOSE EXTERNAL",
        slug: "premium-tandem-box-soft-close-external",
        description:
          "Premium tandem box system with external soft-close mechanism. Versatile installation options with professional-grade performance.",
        price: 1549.99,
        comparePrice: 2049.99,
        category: createdCategories[2]._id,
        tags: ["premium", "tandem-box", "soft-close", "external", "versatile"],
        variants: [
          { name: "Type", value: "External", stock: 25 },
          { name: "Height", value: "120mm", stock: 30 },
          { name: "Height", value: "180mm", stock: 35 },
          { name: "Installation", value: "Easy", stock: 40 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 40,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-PTBSCE",
        usageArea: "Drawer",
        finish: "Premium",
      },

      // Lift-Up Systems Category
      {
        name: "AVENTOS HF - LIFT-UP SYSTEM",
        slug: "aventos-hf-lift-up-system",
        description:
          "AVENTOS HF lift-up system for fold-up doors. Space-saving solution inspired by international designs for overhead cabinets.",
        price: 2299.99,
        comparePrice: 2999.99,
        category: createdCategories[3]._id,
        tags: ["aventos", "hf", "lift-up", "fold-up", "space-saving"],
        variants: [
          { name: "Door Weight", value: "2-4kg", stock: 20 },
          { name: "Door Weight", value: "4-7kg", stock: 25 },
          { name: "Opening Angle", value: "90°", stock: 30 },
          { name: "Installation", value: "Overlay", stock: 35 },
        ],
        images: [
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 35,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-AVHF",
        usageArea: "Overhead",
        finish: "Premium",
      },
      {
        name: "AVENTOS HL - LIFT-UP SYSTEM",
        slug: "aventos-hl-lift-up-system",
        description:
          "AVENTOS HL lift-up system for medium-sized doors. Balanced opening force with smooth operation for everyday use.",
        price: 2499.99,
        comparePrice: 3299.99,
        category: createdCategories[3]._id,
        tags: ["aventos", "hl", "lift-up", "medium-sized", "balanced"],
        variants: [
          { name: "Door Weight", value: "5-10kg", stock: 18 },
          { name: "Door Weight", value: "10-15kg", stock: 22 },
          { name: "Opening Force", value: "Medium", stock: 28 },
          { name: "Usage", value: "Everyday", stock: 32 },
        ],
        images: [
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 30,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-AVHL",
        usageArea: "Overhead",
        finish: "Premium",
      },
      {
        name: "AVENTOS HK - LIFT-UP SYSTEM",
        slug: "aventos-hk-lift-up-system",
        description:
          "AVENTOS HK lift-up system for corner and narrow cabinets. Optimized for compact spaces with reliable performance.",
        price: 2199.99,
        comparePrice: 2899.99,
        category: createdCategories[3]._id,
        tags: ["aventos", "hk", "lift-up", "corner", "narrow", "compact"],
        variants: [
          { name: "Application", value: "Corner", stock: 15 },
          { name: "Application", value: "Narrow", stock: 20 },
          { name: "Space", value: "Compact", stock: 25 },
          { name: "Performance", value: "Reliable", stock: 30 },
        ],
        images: [
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 25,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-AVHK",
        usageArea: "Overhead",
        finish: "Premium",
      },
      {
        name: "AVENTOS HS - LIFT-UP SYSTEM",
        slug: "aventos-hs-lift-up-system",
        description:
          "AVENTOS HS lift-up system for stay-up doors. Superior stay-up performance for frequently accessed overhead storage.",
        price: 2599.99,
        comparePrice: 3399.99,
        category: createdCategories[3]._id,
        tags: ["aventos", "hs", "lift-up", "stay-up", "frequently-accessed"],
        variants: [
          { name: "Stay Force", value: "Strong", stock: 12 },
          { name: "Stay Force", value: "Extra Strong", stock: 18 },
          { name: "Access", value: "Frequent", stock: 24 },
          { name: "Performance", value: "Superior", stock: 28 },
        ],
        images: [
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 22,
        featured: true,
        operationType: "Soft Close",
        productCode: "KITI-AVHS",
        usageArea: "Overhead",
        finish: "Premium",
      },

      // Wardrobe & Sliding Accessories Category
      {
        name: "ALUMINIUM SLIDING SYSTEM - 2 TRACK",
        slug: "aluminium-sliding-system-2-track",
        description:
          "Premium 2-track aluminium sliding system for wardrobes. Smooth operation with durable construction for long-lasting performance.",
        price: 1899.99,
        comparePrice: 2499.99,
        category: createdCategories[4]._id,
        tags: [
          "aluminium",
          "sliding",
          "2-track",
          "wardrobe",
          "smooth-operation",
        ],
        variants: [
          { name: "Track Type", value: "2 Track", stock: 25 },
          { name: "Length", value: "1.8m", stock: 30 },
          { name: "Length", value: "2.4m", stock: 35 },
          { name: "Load Capacity", value: "80kg", stock: 40 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 40,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-AS2T",
        usageArea: "Wardrobe",
        finish: "Aluminium",
      },
      {
        name: "ALUMINIUM SLIDING SYSTEM - 3 TRACK",
        slug: "aluminium-sliding-system-3-track",
        description:
          "Advanced 3-track aluminium sliding system for large wardrobes. Maximum space utilization with smooth multi-panel operation.",
        price: 2599.99,
        comparePrice: 3399.99,
        category: createdCategories[4]._id,
        tags: [
          "aluminium",
          "sliding",
          "3-track",
          "large-wardrobe",
          "multi-panel",
        ],
        variants: [
          { name: "Track Type", value: "3 Track", stock: 20 },
          { name: "Length", value: "2.4m", stock: 25 },
          { name: "Length", value: "3.0m", stock: 30 },
          { name: "Panels", value: "3", stock: 35 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 30,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-AS3T",
        usageArea: "Wardrobe",
        finish: "Aluminium",
      },
      {
        name: "WARDROBE LOCKING SYSTEMS",
        slug: "wardrobe-locking-systems",
        description:
          "Secure locking systems for wardrobe doors and drawers. Multiple locking options for enhanced security and privacy.",
        price: 399.99,
        comparePrice: 549.99,
        category: createdCategories[4]._id,
        tags: [
          "locking",
          "security",
          "wardrobe",
          "privacy",
          "multiple-options",
        ],
        variants: [
          { name: "Type", value: "Key Lock", stock: 30 },
          { name: "Type", value: "Digital Lock", stock: 25 },
          { name: "Application", value: "Door", stock: 35 },
          { name: "Application", value: "Drawer", stock: 40 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 45,
        featured: false,
        operationType: "Non-Soft Close",
        productCode: "KITI-WLS",
        usageArea: "Wardrobe",
        finish: "Chrome",
      },
      {
        name: "WARDROBE HINGES & CATCHERS",
        slug: "wardrobe-hinges-catchers",
        description:
          "Complete set of hinges and catchers for wardrobe doors. Reliable operation with easy installation and adjustment.",
        price: 299.99,
        comparePrice: 449.99,
        category: createdCategories[4]._id,
        tags: [
          "hinges",
          "catchers",
          "wardrobe",
          "reliable",
          "easy-installation",
        ],
        variants: [
          { name: "Type", value: "Hinge", stock: 40 },
          { name: "Type", value: "Catcher", stock: 35 },
          { name: "Installation", value: "Easy", stock: 45 },
          { name: "Adjustment", value: "Yes", stock: 50 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 55,
        featured: false,
        operationType: "Non-Soft Close",
        productCode: "KITI-WHC",
        usageArea: "Wardrobe",
        finish: "Chrome",
      },

      // Designer Handles & Accessories Category
      {
        name: "DESIGNER HANDLES COLLECTION",
        slug: "designer-handles-collection",
        description:
          "Premium designer handles collection with various styles and finishes. Elegant designs for modern kitchen and wardrobe applications.",
        price: 199.99,
        comparePrice: 299.99,
        category: createdCategories[5]._id,
        tags: ["designer", "handles", "premium", "various-styles", "elegant"],
        variants: [
          { name: "Style", value: "Modern", stock: 50 },
          { name: "Style", value: "Classic", stock: 45 },
          { name: "Length", value: "128mm", stock: 40 },
          { name: "Length", value: "160mm", stock: 35 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 60,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-DHC",
        usageArea: "Kitchen",
        finish: "SS",
      },
      {
        name: "PREMIUM KNOBS SET",
        slug: "premium-knobs-set",
        description:
          "High-quality knobs set for kitchen and wardrobe applications. Comfortable grip with durable construction and elegant appearance.",
        price: 149.99,
        comparePrice: 229.99,
        category: createdCategories[5]._id,
        tags: ["knobs", "premium", "comfortable-grip", "durable", "elegant"],
        variants: [
          { name: "Shape", value: "Round", stock: 45 },
          { name: "Shape", value: "Square", stock: 40 },
          { name: "Size", value: "25mm", stock: 35 },
          { name: "Size", value: "30mm", stock: 30 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 50,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-PKS",
        usageArea: "Kitchen",
        finish: "Chrome",
      },
      {
        name: "PVC LEGS FOR CABINETS",
        slug: "pvc-legs-for-cabinets",
        description:
          "Adjustable PVC legs for kitchen cabinets. Height adjustable design with non-slip base for stable cabinet installation.",
        price: 89.99,
        comparePrice: 139.99,
        category: createdCategories[5]._id,
        tags: ["pvc", "legs", "adjustable", "non-slip", "stable"],
        variants: [
          { name: "Height", value: "100mm", stock: 50 },
          { name: "Height", value: "150mm", stock: 45 },
          { name: "Adjustment", value: "20mm", stock: 40 },
          { name: "Base", value: "Non-slip", stock: 55 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 60,
        featured: false,
        operationType: "Non-Soft Close",
        productCode: "KITI-PLC",
        usageArea: "Kitchen",
        finish: "PVC",
      },
      {
        name: "PULL-OUT BASKET SYSTEMS",
        slug: "pull-out-basket-systems",
        description:
          "Convenient pull-out basket systems for kitchen storage. Maximizes accessibility and organization in base cabinets.",
        price: 899.99,
        comparePrice: 1199.99,
        category: createdCategories[5]._id,
        tags: [
          "pull-out",
          "basket",
          "storage",
          "accessibility",
          "organization",
        ],
        variants: [
          { name: "Width", value: "450mm", stock: 30 },
          { name: "Width", value: "600mm", stock: 35 },
          { name: "Tiers", value: "2 Tier", stock: 40 },
          { name: "Tiers", value: "3 Tier", stock: 25 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 40,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-PBS",
        usageArea: "Kitchen",
        finish: "SS",
      },
      {
        name: "DETERGENT HOLDERS",
        slug: "detergent-holders",
        description:
          "Practical detergent holders for kitchen sinks. Easy access storage solution for cleaning supplies under the sink.",
        price: 199.99,
        comparePrice: 299.99,
        category: createdCategories[5]._id,
        tags: [
          "detergent",
          "holders",
          "practical",
          "sink",
          "cleaning-supplies",
        ],
        variants: [
          { name: "Capacity", value: "1L", stock: 40 },
          { name: "Capacity", value: "2L", stock: 35 },
          { name: "Mounting", value: "Door", stock: 30 },
          { name: "Mounting", value: "Wall", stock: 25 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 45,
        featured: false,
        operationType: "Non-Soft Close",
        productCode: "KITI-DH",
        usageArea: "Kitchen",
        finish: "SS",
      },
      {
        name: "SS DISH RACK SYSTEMS",
        slug: "ss-dish-rack-systems",
        description:
          "Stainless steel dish rack systems for efficient dish drying and storage. Corrosion-resistant with modern design.",
        price: 1299.99,
        comparePrice: 1699.99,
        category: createdCategories[5]._id,
        tags: [
          "stainless-steel",
          "dish-rack",
          "efficient",
          "corrosion-resistant",
          "modern",
        ],
        variants: [
          { name: "Size", value: "600mm", stock: 25 },
          { name: "Size", value: "800mm", stock: 30 },
          { name: "Tiers", value: "2 Tier", stock: 35 },
          { name: "Tiers", value: "3 Tier", stock: 20 },
        ],
        images: [
          "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        stock: 35,
        featured: true,
        operationType: "Non-Soft Close",
        productCode: "KITI-SSDR",
        usageArea: "Kitchen",
        finish: "SS",
      },
    ];

    await Product.insertMany(products);
    console.log("🔧 Created Kiti Locks catalog products");

    console.log("✅ Kiti Locks catalog database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`👥 Users: ${await User.countDocuments()}`);
    console.log(`📁 Categories: ${await Category.countDocuments()}`);
    console.log(`🔧 Products: ${await Product.countDocuments()}`);
    console.log(
      `⭐ Featured Products: ${await Product.countDocuments({ featured: true })}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
