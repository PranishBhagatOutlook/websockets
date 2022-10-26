import axios from "axios";

const BASE_URL = "http://localhost:8080/";

class ChatAppService {
  getAllUsers() {
    axios.get(BASE_URL + "getAllUser", null);
  }
}
export default new ChatAppService();
