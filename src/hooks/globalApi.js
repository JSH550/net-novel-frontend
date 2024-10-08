import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import router from "@/router";


const BACKEND_URL = 'http://localhost:8081/api';

// Axios 인스턴스 생성
const instance = axios.create({
  baseURL: BACKEND_URL, //백엔드 서버 url
  withCredentials: true, //세션 인증 처리
  timeout: 5000, //최대 응답 대기 시간 
});

const api = setupCache(instance, {
  methods: ['get'],    // GET 요청에 대해서만 캐시
  ttl: 1000 * 60 * 10, // 5분 동안 캐시 유지
  staleIfError: true,  // 에러 발생 시 캐시된 데이터 반환
});


// 요청 인터셉터 미들웨어
api.interceptors.request.use(
  // 요청 전처리
  function (config) {
    return config;
  },
  // 요청이 서버로 전송되기 전에 발생하는 에러 처리
  function (error) {
    alert("서버가 응답하지 않습니다. 잠시 후 다시 접속해주십시오.")
    console.error('Api Request Error: ', error.request);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 미들웨어
api.interceptors.response.use(
  // 응답 전처리
  function (response) {
    return response;
  },
  // 응답 에러 처리
  function (error) {

    // 서버가 응답을 했지만, 상태 코드가 2xx 범위가 아닐 때
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const config = error.config;

      // 전역 처리 여부 확인
      if (config.globalAdvice === true) {
        // 전역 에러 처리 수행
        switch (status) {
          case 400:
            console.error('Global: Bad Request');
            handleBadRequest(data);
            break;
          case 401:
            console.error('Global: Unauthorized');
            handleUnauthorize();
            break;
          case 500:
            console.error('Global: Server Error');
            handleServerError()
            break;
          default:
            console.error('Global: Other Error');
        }

        return Promise.reject(error);
      }
    }

    // 요청이 전송되었지만, 응답이 없을 때 에러 처리
    else if (error.request) {
      console.error("No response received:", error.request);
    }

    // 에러를 다시 throw하여 개별 호출에서도 처리할 수 있도록 함
    return Promise.reject(error);
  }
);

function handleServerError() {
  alert("서버에서 에러가 발생하였습니다.\n잠시 후에 다시 실행하여 주시길 바랍니다.");
}

//400 예외 처리
function handleBadRequest(data) {
  if ((data ?? false)) {
    const messages = data.split(",");
    messages.forEach((msg) => {
      alert(msg);
    });
  }
  else {
    alert(
      "잘못된 요청입니다.\n현상이 지속된다면 고객센터로 문의 바랍니다."
    );
  }
}

//401 예외 처리
function handleUnauthorize() {
  const result = confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까");
  if (result) {
    router.push({ name: 'login' })
  } else {
    router.push({ name: 'home' })
  }
}

export default api;