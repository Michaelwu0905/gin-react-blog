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

export default apiClient