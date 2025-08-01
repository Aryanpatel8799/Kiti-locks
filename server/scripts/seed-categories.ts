import mongoose from "mongoose";
import Category from "../models/Category";
import connectDB from "../config/database";

const seedCategories = async () => {
  try {
    console.log("🌱 Starting category database seed...");

    // Connect to database
    await connectDB();

    // Clear existing categories
    await Category.deleteMany({});
    console.log("🧹 Cleared existing categories");

    // Create the specified categories
    const categories = [
      {
        name: "Hardware",
        slug: "hardware",
        description: "Complete range of hardware solutions including hinges, handles, locks, and fittings for all your construction and renovation needs.",
        featured: true,
        sortOrder: 1,
        seo: {
          title: "Hardware - Complete Hardware Solutions",
          description: "Shop premium hardware including hinges, handles, locks, and fittings for construction and renovation projects."
        }
      },
      {
        name: "Kitchen",
        slug: "kitchen",
        description: "Premium kitchen hardware and accessories including soft-close hinges, drawer systems, lift-up mechanisms, and kitchen organizers.",
        featured: true,
        sortOrder: 2,
        seo: {
          title: "Kitchen Hardware - Premium Kitchen Solutions",
          description: "Discover premium kitchen hardware including soft-close hinges, drawer systems, and kitchen organizers."
        }
      },
      {
        name: "Wardrobe",
        slug: "wardrobe",
        description: "Complete wardrobe solutions including sliding systems, hinges, locks, and accessories for modern wardrobe installations.",
        featured: true,
        sortOrder: 3,
        seo: {
          title: "Wardrobe Hardware - Complete Wardrobe Solutions",
          description: "Shop wardrobe hardware including sliding systems, hinges, locks, and accessories for modern wardrobes."
        }
      },
      {
        name: "Home Decor",
        slug: "home-decor",
        description: "Elegant home decor items including designer handles, knobs, decorative fittings, and accessories to enhance your living spaces.",
        featured: true,
        sortOrder: 4,
        seo: {
          title: "Home Decor - Elegant Home Accessories",
          description: "Discover elegant home decor including designer handles, knobs, and decorative fittings for your living spaces."
        }
      },
      {
        name: "Sanitary",
        slug: "sanitary",
        description: "Complete sanitary ware solutions including bathroom fittings, shower systems, toilet accessories, and plumbing hardware.",
        featured: true,
        sortOrder: 5,
        seo: {
          title: "Sanitary Ware - Complete Bathroom Solutions",
          description: "Shop sanitary ware including bathroom fittings, shower systems, and plumbing hardware for modern bathrooms."
        }
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log("📁 Created main categories");

    // Create subcategories for each main category
    const subcategories = [
      // Hardware subcategories
      {
        name: "Hinges",
        slug: "hinges",
        description: "Complete range of hinges including soft-close, standard, and specialty hinges for various applications.",
        parent: createdCategories[0]._id,
        featured: true,
        sortOrder: 1
      },
      {
        name: "Handles & Knobs",
        slug: "handles-knobs",
        description: "Premium handles and knobs in various styles, finishes, and sizes for doors and drawers.",
        parent: createdCategories[0]._id,
        featured: true,
        sortOrder: 2
      },
      {
        name: "Locks & Latches",
        slug: "locks-latches",
        description: "Security solutions including door locks, cabinet locks, and latches for enhanced safety.",
        parent: createdCategories[0]._id,
        featured: true,
        sortOrder: 3
      },
      {
        name: "Fittings & Accessories",
        slug: "fittings-accessories",
        description: "Essential fittings and accessories for complete hardware installations.",
        parent: createdCategories[0]._id,
        featured: false,
        sortOrder: 4
      },

      // Kitchen subcategories
      {
        name: "Soft Close Hinges",
        slug: "soft-close-hinges",
        description: "Premium soft-close hinges for silent cabinet operation with various cup sizes and overlay types.",
        parent: createdCategories[1]._id,
        featured: true,
        sortOrder: 1
      },
      {
        name: "Drawer Systems",
        slug: "drawer-systems",
        description: "Complete drawer systems including telescopic channels, soft-close mechanisms, and modular boxes.",
        parent: createdCategories[1]._id,
        featured: true,
        sortOrder: 2
      },
      {
        name: "Lift-Up Systems",
        slug: "lift-up-systems",
        description: "Space-saving lift-up systems for overhead cabinets with smooth operation and stay-up functionality.",
        parent: createdCategories[1]._id,
        featured: true,
        sortOrder: 3
      },
      {
        name: "Kitchen Organizers",
        slug: "kitchen-organizers",
        description: "Practical kitchen organizers including pull-out baskets, spice racks, and storage solutions.",
        parent: createdCategories[1]._id,
        featured: true,
        sortOrder: 4
      },

      // Wardrobe subcategories
      {
        name: "Sliding Systems",
        slug: "sliding-systems",
        description: "Premium sliding systems for wardrobes including 2-track and 3-track configurations.",
        parent: createdCategories[2]._id,
        featured: true,
        sortOrder: 1
      },
      {
        name: "Wardrobe Hinges",
        slug: "wardrobe-hinges",
        description: "Specialized hinges for wardrobe doors with smooth operation and easy adjustment.",
        parent: createdCategories[2]._id,
        featured: true,
        sortOrder: 2
      },
      {
        name: "Wardrobe Locks",
        slug: "wardrobe-locks",
        description: "Security solutions for wardrobes including key locks and digital locking systems.",
        parent: createdCategories[2]._id,
        featured: true,
        sortOrder: 3
      },
      {
        name: "Wardrobe Accessories",
        slug: "wardrobe-accessories",
        description: "Essential wardrobe accessories including catchers, stoppers, and mounting hardware.",
        parent: createdCategories[2]._id,
        featured: false,
        sortOrder: 4
      },

      // Home Decor subcategories
      {
        name: "Designer Handles",
        slug: "designer-handles",
        description: "Elegant designer handles in various styles and finishes to enhance your home aesthetics.",
        parent: createdCategories[3]._id,
        featured: true,
        sortOrder: 1
      },
      {
        name: "Decorative Knobs",
        slug: "decorative-knobs",
        description: "Beautiful decorative knobs and pulls for furniture and cabinets with unique designs.",
        parent: createdCategories[3]._id,
        featured: true,
        sortOrder: 2
      },
      {
        name: "Decorative Fittings",
        slug: "decorative-fittings",
        description: "Decorative fittings and accessories to add style and elegance to your living spaces.",
        parent: createdCategories[3]._id,
        featured: true,
        sortOrder: 3
      },
      {
        name: "Home Accessories",
        slug: "home-accessories",
        description: "Essential home accessories and decorative items for complete home styling.",
        parent: createdCategories[3]._id,
        featured: false,
        sortOrder: 4
      },

      // Sanitary subcategories
      {
        name: "Bathroom Fittings",
        slug: "bathroom-fittings",
        description: "Complete bathroom fittings including taps, mixers, and accessories for modern bathrooms.",
        parent: createdCategories[4]._id,
        featured: true,
        sortOrder: 1
      },
      {
        name: "Shower Systems",
        slug: "shower-systems",
        description: "Premium shower systems including shower heads, mixers, and complete shower solutions.",
        parent: createdCategories[4]._id,
        featured: true,
        sortOrder: 2
      },
      {
        name: "Toilet Accessories",
        slug: "toilet-accessories",
        description: "Essential toilet accessories including seats, flush mechanisms, and bathroom hardware.",
        parent: createdCategories[4]._id,
        featured: true,
        sortOrder: 3
      },
      {
        name: "Plumbing Hardware",
        slug: "plumbing-hardware",
        description: "Complete plumbing hardware including pipes, fittings, and installation accessories.",
        parent: createdCategories[4]._id,
        featured: false,
        sortOrder: 4
      }
    ];

    await Category.insertMany(subcategories);
    console.log("📁 Created subcategories");

    console.log("✅ Category database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`📁 Main Categories: ${await Category.countDocuments({ parent: null })}`);
    console.log(`📁 Subcategories: ${await Category.countDocuments({ parent: { $ne: null } })}`);
    console.log(`⭐ Featured Categories: ${await Category.countDocuments({ featured: true })}`);

    console.log("\n📋 Created Categories:");
    const mainCategories = await Category.find({ parent: null }).sort({ sortOrder: 1 });
    for (const category of mainCategories) {
      console.log(`  • ${category.name} (${category.slug})`);
      const subcategories = await Category.find({ parent: category._id }).sort({ sortOrder: 1 });
      for (const sub of subcategories) {
        console.log(`    - ${sub.name} (${sub.slug})`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories(); 