import multer from 'multer';
import path from 'path';

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/')); 
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`); 
    },
});

export const upload = multer({ storage: storage });
export const uploadProfileImage = upload.single('profileImage');
export const uploadSectionImage = upload.single('section_image');
export const uploadModuleImage = upload.single('module_image');
export const uploadFile = upload.single('file');
export const uploadMultipleFiles = upload.array('file', 50);