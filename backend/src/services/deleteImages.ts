// import mongoose, { Model } from 'mongoose';
// import fs from 'fs-extra';
// import path from 'path';


// export const deleteImageFile = async (
//     modelOrName: string | Model<any>,
//     id: string,
//     file_path: string
// ) => {
//     try {
//         let Model: Model<any>;
//         if (typeof modelOrName === 'string') {
//             if (!mongoose.models[modelOrName]) {
//                 throw new Error(`Model ${modelOrName} is not registered with Mongoose`);
//             }
//             Model = mongoose.model(modelOrName);
//         } else if (modelOrName.modelName) {
//             Model = modelOrName;
//         } else {
//             throw new Error('Invalid model or model name provided');
//         }

//         const document = await Model.findById(id);

//         if (!document) {
//             throw new Error(`Document with ID ${id} not found`);
//         }
//         const keys = file_path.split('.');
//         const imageName = keys.reduce((obj, key) => obj && obj[key] !== 'undefined' ? obj[key] : undefined, document);

//         if (!imageName) {
//             // throw new Error('No image field found in the document');
//             console.log("No image field found in the document")
//         }

//         // Construct the image path
//         const uploadsFolderPath = path.join(__dirname, '..', 'uploads');
//         const imagePath = path.join(uploadsFolderPath, imageName);

//         console.log("Uploads folder path:", uploadsFolderPath);
//         console.log("Full image path:", imagePath);

//         // Check if file exists before attempting to delete
//         if (fs.existsSync(imagePath)) {
//             // Delete the image file
//             fs.unlinkSync(imagePath);
//             console.log(`Image file ${imageName} deleted successfully`);
//             await Model.findByIdAndUpdate(id, { $unset: { image: 1 } });
//         } else {
//             console.log(`Image file ${imageName} not found in the uploads folder`);
//         }

//     } catch (error) {
//         console.error('Error deleting image file:', error);
//     }
// };


