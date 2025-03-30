import axios from "axios";

const api = axios.create({
    baseURL:"http://192.168.0.163:4004/",
    responseType: 'json',
    withCredentials: true,
})

export default api;
