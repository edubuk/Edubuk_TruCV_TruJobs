
import axios  from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from './main';

export const uploadFile = async(formData:any) => {
try {
    console.log("formdata",formData);
    const response = await axios.post(`${API_BASE_URL}/file/upload`, formData);
      return response;
      //console.log("res",response);
} catch (error) {
    console.log("error while doc/img uploading",error);
    toast.error("something went wrong");
    return error;
}
}


