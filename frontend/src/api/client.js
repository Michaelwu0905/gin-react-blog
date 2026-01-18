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

// 请求拦截器：自动添加 Authorization Header
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器：处理 401 错误
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token 过期或无效，清除本地存储
            localStorage.removeItem('token');
            // 可以在这里触发重定向到登录页
        }
        return Promise.reject(error);
    }
);

// 图片上传函数
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });
    
    return response.data.url;
};

export default apiClient
