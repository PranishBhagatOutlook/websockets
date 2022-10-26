import axios from "axios";

const BASE_URL = "http://localhost:8080/";

class ChatAppService {
  getAllUser() {
    axios.get(BASE_URL + "getAllUser",null);
  }
}
export default new ChatAppService();
