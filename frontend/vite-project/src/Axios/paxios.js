import axios from "axios";

const papi = axios.create({
  baseURL: import.meta.env.VITE_PBACKEND_URL,
  withCredentials: true,
});
console.log("papi Base URL:", papi.defaults.baseURL);

export default papi;