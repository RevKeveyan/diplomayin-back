const BaseController = require("./baseController");
const Product = require("../models/Product");
const User = require("../models/User");
const { optimizeImages } = require("../middleware/fileMidlleware1");

class ProductController extends BaseController {
  constructor(Product) {
    super(Product);
  }
  getAll = async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sortOption,
      search,
      priceRange,
      liked,
      discounts,
      inStock,
      myProducts,
      userId,
      ...filters
    } = req.query;
  
    try {
      const sortOptions = {
        "price-asc": { price: 1 },
        "price-desc": { price: -1 },
        newest: { createdAt: -1 },
        default: { createdAt: 1 },
      };
      const sortConfig = sortOptions[sortOption] || sortOptions.default;
      const skip = (page - 1) * limit;
  
      let query = {};
  
      // 🔍 Поиск по названию и описанию
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
  
      // 💰 Фильтрация по цене
      if (priceRange) {
        query.price = { $lte: parseInt(priceRange) };
      }
  
      // ❤️ Избранные продукты
      if (liked === "true" && userId) {
        const user = await User.findById(userId).select("likedProducts");
        if (user) {
          query._id = { $in: user.likedProducts };
        }
      }
  
      // 📦 Мои товары
      if (myProducts === "true" && userId) {
        query.seller = userId;
      }
  
      // 🎯 Фильтр по скидке
      if (discounts === "true") {
        query.discount = { $gt: 0 };
      }
  
      // 🛒 Фильтр по наличию
      if (inStock === "true") {
        query.stock = { $gt: 0 };
      }
  
      // 🧩 Динамические фильтры
      const validFilters = [
        "size",
        "color",
        "brand",
        "material",
        "author",
        "language",
        "warranty",
        "deliveryType",
        "countryOfOrigin",
        "category",
        "subCategory",
        "type",
        "tags",
      ];
  
      validFilters.forEach((key) => {
        if (filters[key] && filters[key] !== "all" && filters[key] !== "") {
          query[key] = filters[key];
        }
      });
  
      // 🔄 Пагинация и сортировка
      const totalCount = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
  
      const items = await Product.find(query)
        .populate("seller", "firstName email")
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit));
  
      res.status(200).json({ items, totalPages });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching data", error: error.message });
    }
  };
  
  

  likeProduct = async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const product = await Product.findById(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const likedIndex = user.likedProducts.indexOf(productId);

      if (likedIndex === -1) {
        // Если товара нет в списке лайков - добавляем
        user.likedProducts.push(productId);

        // Обновляем предпочтения пользователя
        if (!user.preferredCategories.includes(product.category)) {
          user.preferredCategories.push(product.category);
        }

        product.tags.forEach((tag) => {
          if (!user.preferredTags.includes(tag)) {
            user.preferredTags.push(tag);
          }
        });

        if (!user.preferredTypes.includes(product.type)) {
          user.preferredTypes.push(product.type);
        }
      } else {
        // Если товар уже лайкнут - убираем лайк
        user.likedProducts.splice(likedIndex, 1);
      }

      await user.save();

      res.status(200).json({
        message: "Product like status updated",
        likedProducts: user.likedProducts,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating liked products",
        error: error.message,
      });
    }
  };

  getProdById = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id)
        .populate({ path: "seller", select: "firstName" }) // Получаем только имя продавца
        // .populate("reviews"); // Получаем отзывы

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({ product });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching product details",
        error: error.message,
      });
    }
  };

  sendComplaint = async (req, res) => {
    try {
      const { productId, reason } = req.body;
      const userId = req.user.id;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.complaints.push({ userId, reason });
      await product.save();

      res.status(200).json({ message: "Complaint sent successfully", product });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error sending complaint", error: error.message });
    }
  };

  offerPrice = async (req, res) => {
    try {
      const { productId, offeredPrice } = req.body;
      const userId = req.user.id;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.offers.push({ userId, offeredPrice });
      await product.save();

      res.status(200).json({ message: "Offer sent successfully", product });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error sending offer", error: error.message });
    }
  };

  purchaseProduct = async (req, res) => {
    try {
      const { productId, paymentInfo } = req.body;
      const userId = req.user.id;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({ message: "Product purchased successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error purchasing product", error: error.message });
    }
  };

  respondToOffer = async (req, res) => {
    try {
      const { productId, offerId, response } = req.body;
      const sellerId = req.params.id;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.seller.toString() !== sellerId) {
        return res
          .status(403)
          .json({ message: "Only the seller can respond to offers" });
      }

      const offer = product.offers.id(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      offer.status = response;
      await product.save();

      res
        .status(200)
        .json({ message: `Offer ${response} successfully`, product });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error responding to offer", error: error.message });
    }
  };

  getLikedProducts = async (req, res) => {
    const { id: userId } = req.params;
    const { category } = req.query;
  
    try {
      // Получаем пользователя с только нужным полем likedProducts
      const user = await User.findById(userId).select("likedProducts");
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Если нужна фильтрация по категории, делаем отдельный запрос
      if (category) {
        const filteredProducts = await Product.find({
          _id: { $in: user.likedProducts },
          category: category,
        }).select("_id");
  
        const idsOnly = filteredProducts.map((p) => p._id.toString());
  
        return res.status(200).json({ likedProductIds: idsOnly });
      }
  
      // Без фильтрации возвращаем только ID
      const likedIds = user.likedProducts.map((id) => id.toString());
  
      res.status(200).json({ likedProductIds: likedIds });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching liked product IDs",
        error: error.message,
      });
    }
  };
  


getDiscountedProducts = async (req, res) => {
  const { category } = req.query;

  try {
      const filter = { discount: { $gt: 0 } };

      if (category && category !== "all" && category !== "other") {
          filter.category = category;
      }

      const discountedProducts = await Product.find(filter)
          .sort({ updatedAt: -1, discount: -1 })
          .limit(6);

      res.status(200).json({ discountedProducts });
  } catch (error) {
      res.status(500).json({
          message: "Error fetching discounted products",
          error: error.message,
      });
  }
};

getRecommendedProducts = async (req, res) => {
    const { id: userId } = req.params;
    const { category } = req.query;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const {
            preferredCategories,
            preferredTags,
            likedProducts,
        } = user;
        const likedProductIds = likedProducts.map((id) => id.toString());

        const filter = {
            tags: { $in: preferredTags },
            _id: { $nin: likedProductIds }, // Исключаем лайкнутые товары
        };

        if (category) {
          if(category === "all" || category === "other"){
            filter.category = { $in: preferredCategories };
          }else{
            filter.category = category;
          }
        } else {
            filter.category = { $in: preferredCategories }; // Если категория не указана, берём из предпочтений
        }

        const recommendedProducts = await Product.find(filter).limit(6);

        res.status(200).json({ recommendedProducts });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching recommended products",
            error: error.message,
        });
    }
};

updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Проверка владельца товара
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Разрешаем редактировать только владельцу
    if (product.seller.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    // Оптимизация изображений, если есть новые
    let updatedImages = product.images;
    if (req.files && req.files.length > 0) {
      updatedImages = await optimizeImages(req.files);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updateData, images: updatedImages },
      { new: true }
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};

deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};

}

module.exports = new ProductController(Product);
