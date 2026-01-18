import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
    // /api指相对路径
    // 浏览器会请求当前域名下的/api，并由nginx或vite负责转发
    baseURL:'/api',
    headers:{
        'Content-Type':'application/json',
    },
});

// 图片上传函数
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post('/api/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    
    return response.data.url;
};

export default apiClient