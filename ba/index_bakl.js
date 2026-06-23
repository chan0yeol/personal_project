const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 쿠키 여기에 붙여넣기 (만료되면 교체 필요)
const COOKIE = `_fwb=1441P1azCL6LfYvlsK4Ygf9.1756948228344; bora_uid=ph71120240702195923; _ga=GA1.1.1037509726.1756948229; SCOUTER=z3jlp3ssd7e7v3; JSESSIONID=A2AEC6AFC22C50DEFEA0ABB1E8963422; AWSALB=UutW0CzXx3YmbW4dlYZ1jrUUl6MzHOnYKTzbgXQnnqqnTJo94pFbnHvik0o+EtqzAjar6OIup+5lbHOhrPHeNS49oyxkjkVER160H9pfN2oe+XTvR3WIHrJJ7lsw; AWSALBCORS=UutW0CzXx3YmbW4dlYZ1jrUUl6MzHOnYKTzbgXQnnqqnTJo94pFbnHvik0o+EtqzAjar6OIup+5lbHOhrPHeNS49oyxkjkVER160H9pfN2oe+XTvR3WIHrJJ7lsw; AWSALBTG=Vw8pY4iKZheJC9tejtxhfPfaJsFCcsorL0+5cWAwZjkbKPWDRatw0mgTLs+5uNkdcRjtwLL5ouOCrstnPHDDL4KTi/jXmHW9aDmJByUcazaOu51empqi0gvx9zHNMf5gqTOAGcuZMmHPcrhUiU7aDWf11n0T5iZOQ/ShzBsUrFJ9; AWSALBTGCORS=Vw8pY4iKZheJC9tejtxhfPfaJsFCcsorL0+5cWAwZjkbKPWDRatw0mgTLs+5uNkdcRjtwLL5ouOCrstnPHDDL4KTi/jXmHW9aDmJByUcazaOu51empqi0gvx9zHNMf5gqTOAGcuZMmHPcrhUiU7aDWf11n0T5iZOQ/ShzBsUrFJ9`;

const TARGET_URL = "https://leave.unipost.co.kr/unicloud/avs/report/getMonthReportAvsUse";

const ITEM_IDS = [
  "2673DED180C14058A5492AD0C6593D45",
  "01A614219FAE435E991B16B84956D5E4",
  "5F451BD3A3A042C889FDCD8334FE5826",
  "CC63430C4EB746E8BCF2629483F6C646",
  "B4D79AED292B8991E050E7DE961F6DAB",
  "B4D79AED292D8991E050E7DE961F6DAB",
  "2A65F1A08644427EB79313D8DED9F5DA",
];

// 날짜 포맷 헬퍼 (YYYY-MM-DD)
function getToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 오늘 휴가자 조회 API
app.get("/api/today-vacation", async (req, res) => {
  const today = getToday();

  const requestBody = {
    coRegno: "1048621562",
    deptId: null,
    usId: null,
    sSdate: today,
    sEdate: today,
    itemIds: ITEM_IDS,
    userStatus: "10",
    procSts: "S",
  };

  try {
    const response = await axios.post(TARGET_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Cookie: COOKIE,
        Origin: "https://leave.unipost.co.kr",
        Referer: "https://leave.unipost.co.kr/unicloud/view/avs-use-month-report",
      },
    });

    const rawList = response.data?.list ?? response.data ?? [];

    // 오늘 날짜에 걸치는 휴가자만 필터링
    const todayVacations = rawList.filter((item) => {
      const start = item.useSdate ?? "";
      const end = item.useEdate ?? "";
      return start <= today && today <= end;
    });

    // 필요한 필드만 정리해서 반환
    const result = todayVacations.map((item) => {
      const base = {
        usName: item.usName,
        deptName: item.deptName,
        useSdate: item.useSdate,
        useEdate: item.useEdate,
        timeUnitName: item.timeUnitName,
      };

      // 시간 단위인 경우 추가 필드 포함
      if (item.timeUnitName === "시간" || item.timeUnitName === "반차") {
        base.useTimeType = item.useTimeType ?? null;
        base.useTimeTypeName = item.useTimeTypeName ?? null;
        base.useStime = item.useStime ?? null;
        base.useEtime = item.useEtime ?? null;
      }

      return base;
    });

    res.json({
      date: today,
      count: result.length,
      list: result,
    });
  } catch (error) {
    console.error("기존 API 호출 실패:", error.message);
    res.status(500).json({
      error: "기존 API 호출 실패",
      detail: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📅 오늘 휴가자 조회: GET http://localhost:${PORT}/api/today-vacation`);
});
