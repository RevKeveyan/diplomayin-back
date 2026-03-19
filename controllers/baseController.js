const { optimizeImages } = require("../middleware/fileMidlleware1");

class BaseController {
  constructor(model) {
    this.BaseModel = model;
  }

//   getAll = async (req, res) => {
//     const { page = 1, limit = 10, sortOption, search, priceRange, liked, userId, ...filters } = req.query;

//     try {
//         const sortOptions = {
//             'price-asc': { price: 1 },
//             'price-desc': { price: -1 },
//             'newest': { createdAt: -1 },
//             'default': { createdAt: 1 },
//         };
//         const sortConfig = sortOptions[sortOption] || sortOptions['default'];
//         const skip = (page - 1) * limit;

//         let query = {};

//         // 🔹 Поиск по названию и описанию
//         if (search) {
//             query.$or = [
//                 { name: { $regex: search, $options: "i" } },
//                 { description: { $regex: search, $options: "i" } },
//             ];
//         }

//         // 🔹 Фильтрация по цене
//         if (priceRange) {
//             query.price = { $lte: parseInt(priceRange) };
//         }

//         // 🔹 Фильтр по избранным (wishlist)
//         if (liked === "true" && userId) {
//             const user = await User.findById(userId).select("likedProducts");
//             if (user) {
//                 query._id = { $in: user.likedProducts };
//             }
//         }

//         // 🔹 Обрабатываем остальные фильтры
//         Object.keys(filters).forEach((key) => {
//             if (filters[key] !== "all" && filters[key] !== "") {
//                 if (typeof filters[key] === "boolean") {
//                     query[key] = filters[key]; // Для чекбоксов (true/false)
//                 } else {
//                     query[key] = filters[key]; // Для обычных значений
//                 }
//             }
//         });

//         const totalCount = await Product.countDocuments(query);
//         const totalPages = Math.ceil(totalCount / limit);

//         const items = await Product.find(query)
//             .populate('seller', 'firstName email')
//             .sort(sortConfig)
//             .skip(skip)
//             .limit(parseInt(limit));

//         res.status(200).json({ items, totalPages });
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching data", error: error.message });
//     }
// };

  

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const item = await this.BaseModel.findById(id).populate('seller', 'firstName email');
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching item', error: error.message });
    }
  };

  create = async (req, res) => {
    try {
      const data = req.body;
      const seller = req.params.id;
      const images = req.files.length > 0 ? await optimizeImages(req.files) : [];
      // data.image = req.file ? req.file.path.slice(14) : null;
      if (images && images.length == 0) {
        return res.status(500).json({ message: "Image " });
      }
      const creationDate = new Date();
      data.createdAt = creationDate;

      const newModel = new this.BaseModel({ ...data, seller,images });
      await newModel.save();

      return res.status(201).json({ message: "Product added" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error" });
    }
  
  };

  

  update = async (req, res) => {
    try {
      const { id } = req.params;
      
      const data = req.body;
      const updatedItem = await this.BaseModel.findByIdAndUpdate(id, data, { new: true });
      if (!updatedItem) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedItem = await this.BaseModel.findByIdAndDelete(id);
      if (!deletedItem) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
  };

  buildQuery = (filter, search) => {
    const query = {};

    if (filter.category) query.category = filter.category;
    if (filter.priceFrom || filter.priceTo) {
      query.price = {};
      if (filter.priceFrom) query.price.$gte = Number(filter.priceFrom);
      if (filter.priceTo) query.price.$lte = Number(filter.priceTo);
    }

    if (filter.tags) {
      query.tags = { $in: filter.tags.split(',') };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return query;
  };


}

module.exports = BaseController;
