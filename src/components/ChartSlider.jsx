import React, { useState, useContext } from "react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Line } from "react-chartjs-2";
import { subDays, format } from "date-fns";
import { MdFormatListBulletedAdd, MdOutlinePlayCircleFilled, MdClose, MdHive } from "react-icons/md";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MusicPlayerContext } from "../context/MusicPlayerProvider"; // 필요에 따라 경로 수정
import Modal from "./Modal"; // 필요에 따라 경로 수정
import Loading from "./Loading2"; // 로딩 컴포넌트 임포트

const formatDate = (date) => format(date, "yyyy-MM-dd");

const getLastMonthDates = () => {
    const dates = [];
    for (let i = 1; i <= 30; i++) {
        dates.push(formatDate(subDays(new Date(), i)));
    }
    return dates;
};

const ChartSlider = ({ charts, title, id }) => {
    const [youtubeResults, setYoutubeResults] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    const { addTrackToList, addTrackToEnd, playTrack } = useContext(MusicPlayerContext);

    const fetchRankingData = async (title) => {
        setIsLoading(true); // 로딩 시작
        const loadStartTime = Date.now(); // 로딩 시작 시간 기록
        const dates = getLastMonthDates();
        const rankingData = [];

        for (let date of dates) {
            const url = `https://raw.githubusercontent.com/KIMJW04/music-chart/main/${id}/${id}100_${date}.json`;

            try {
                const response = await axios.get(url);
                const charts = response.data;

                const chart = charts.find((chart) => chart.title === title);
                if (chart) {
                    rankingData.push({ date, rank: parseInt(chart.rank, 10) });
                }
            } catch (error) {
                console.error(`Failed to fetch data for date: ${date}`, error);
            }
        }

        setChartData({
            labels: rankingData.map((data) => data.date),
            datasets: [
                {
                    label: title,
                    backgroundColor: "rgba(75,192,192,0.2)",
                    borderColor: "rgba(75,192,192,1)",
                    borderWidth: 2,
                    data: rankingData.map((data) => data.rank),
                },
            ],
        });

        const loadEndTime = Date.now();
        const loadDuration = loadEndTime - loadStartTime;
        const remainingTime = Math.max(1000 - loadDuration, 0); // 최소 1초 동안 로딩 유지

        setTimeout(() => {
            setIsLoading(false); // 로딩 끝
        }, remainingTime);
    };

    const handleItemClick = (chart) => {
        setSelectedTitle(chart.title);
        searchYoutube(chart.title);
        fetchRankingData(chart.title);
    };

    const searchYoutube = async (query) => {
        try {
            const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
                params: {
                    part: "snippet",
                    q: query,
                    type: "video",
                    maxResults: 5,
                    key: process.env.REACT_APP_YOUTUBE_API_KEY,
                },
            });
            setYoutubeResults(response.data.items);
        } catch (error) {
            console.error("YouTube 검색에 실패했습니다.", error);
        }
    };

    const handlePlayNow = (result) => {
        const newTrack = {
            title: result.snippet.title,
            videoID: result.id.videoId,
            imageURL: result.snippet.thumbnails.default.url,
            artist: result.snippet.channelTitle,
            rank: 1,
        };
        addTrackToList(newTrack);
        playTrack(0);
    };

    const handleAddToList = (result) => {
        const newTrack = {
            title: result.snippet.title,
            videoID: result.id.videoId,
            imageURL: result.snippet.thumbnails.default.url,
            artist: result.snippet.channelTitle,
            rank: 1,
        };
        addTrackToEnd(newTrack);
        toast.success("리스트에 추가했습니다.");
    };

    const handleAddToPlaylistClick = (result) => {
        const newTrack = {
            title: result.snippet.title,
            videoID: result.id.videoId,
            imageURL: result.snippet.thumbnails.default.url,
            artist: result.snippet.channelTitle,
            rank: 1,
        };
        setSelectedTrack(newTrack);
        setIsModalOpen(true);
    };

    const handleAddToPlaylist = (playlistId) => {
        const playlist = JSON.parse(localStorage.getItem(playlistId));
        if (playlist && selectedTrack) {
            playlist.items.push(selectedTrack);
            localStorage.setItem(playlistId, JSON.stringify(playlist));
        }
        setIsModalOpen(false); // 모달 닫기
    };

    if (!charts || charts.length === 0) {
        return <p>차트를 불러오는 중입니다...</p>;
    }

    return (
        <>
            <section id="slider__wrap">
                <h2>😜 {title} Top10</h2>
                <Swiper
                    modules={[Navigation, Pagination, Scrollbar, A11y]}
                    spaceBetween={50}
                    slidesPerView={3}
                    navigation
                    scrollbar={{ draggable: true }}
                    onSwiper={(swiper) => console.log(swiper)}
                    onSlideChange={() => console.log("slide change")}
                >
                    {charts.map((chart, index) => (
                        <SwiperSlide key={index}>
                            <div className="swiper-slide-content" onClick={() => handleItemClick(chart)}>
                                <img src={chart.imageURL} alt={chart.title} />
                                <p>
                                    {chart.rank}. {chart.title} - {chart.artist}
                                </p>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>
            {youtubeResults.length > 0 && (
                <section className="youtube-result">
                    <h3>🧑🏻‍💻 👉 "{selectedTitle}"에 대한 유튜브 검색 결과입니다.</h3>
                    <ul>
                        {youtubeResults.map((result, index) => (
                            <li key={index}>
                                <span className="img" style={{ backgroundImage: `url(${result.snippet.thumbnails.default.url})` }}></span>
                                <span className="title">{result.snippet.title}</span>
                                <span className="playNow" onClick={() => handlePlayNow(result)}>
                                    <MdOutlinePlayCircleFilled />
                                    <span className="ir">노래듣기</span>
                                </span>
                                <span className="listAdd" onClick={() => handleAddToList(result)}>
                                    <MdFormatListBulletedAdd />
                                    <span className="ir">리스트 추가하기</span>
                                </span>
                                <span className="chartAdd" onClick={() => handleAddToPlaylistClick(result)}>
                                    <MdHive />
                                    <span className="ir">나의 리스트에 추가하기</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="chart__wrap">
                        {isLoading ? ( // 로딩 상태 표시
                            <Loading /> // 로딩 컴포넌트 사용
                        ) : (
                            chartData && (
                                <div className="chart">
                                    <h3>{selectedTitle}의 차트</h3>
                                    <div>
                                        <Line
                                            data={chartData}
                                            options={{
                                                maintainAspectRatio: false,
                                                scales: {
                                                    y: {
                                                        reverse: true,
                                                        beginAtZero: false,
                                                        ticks: {
                                                            stepSize: 1,
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    <span className="close" onClick={() => setYoutubeResults([])}>
                        <MdClose />
                    </span>
                </section>
            )}
            <ToastContainer />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddToPlaylist={handleAddToPlaylist} />
        </>
    );
};

export default ChartSlider;
