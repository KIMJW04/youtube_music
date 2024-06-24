import React, { forwardRef, useContext, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import Modal from "./Modal";
import { useParams } from "react-router-dom";
import { subDays, format } from "date-fns";

import { FcCalendar } from "react-icons/fc";
import { MdFormatListBulletedAdd, MdOutlinePlayCircleFilled, MdClose, MdHive } from "react-icons/md";
import { MusicPlayerContext } from "../context/MusicPlayerProvider";

// Register the necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <button onClick={onClick} ref={ref}>
        <FcCalendar size={24} />
        <span>{value}</span>
    </button>
));

const formatDate = (date) => format(date, "yyyy-MM-dd");

const getLastMonthDates = () => {
    const dates = [];
    for (let i = 1; i <= 30; i++) {
        // 날짜 범위를 하루 전부터 한 달 전까지로 수정
        dates.push(formatDate(subDays(new Date(), i)));
    }
    return dates;
};

const Chart = ({ title, showCalendar, selectedDate, onDateChange, minDate, maxDate, data }) => {
    const { id } = useParams(); // id를 URL 파라미터에서 가져옴
    const { addTrackToList, addTrackToEnd, playTrack } = useContext(MusicPlayerContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);

    const [youtubeResults, setYoutubeResults] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [chartData, setChartData] = useState(null);

    const fetchRankingData = async (title) => {
        const dates = getLastMonthDates();
        const rankingData = [];

        for (let date of dates) {
            const url = `https://raw.githubusercontent.com/KIMJW04/music-chart/main/${id}/${id}100_${date}.json`;

            try {
                const response = await axios.get(url);
                const items = response.data;

                const item = items.find((item) => item.title === title);
                if (item) {
                    rankingData.push({ date, rank: parseInt(item.rank, 10) });
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
    };

    const handleItemClick = (item) => {
        setSelectedTitle(item.title);
        searchYoutube(item.title);
        fetchRankingData(item.title);
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
        setSelectedTrack({
            title: result.snippet.title,
            videoID: result.id.videoId,
            imageURL: result.snippet.thumbnails.default.url,
            artist: result.snippet.channelTitle,
            rank: 1,
        });
        setIsModalOpen(true);
    };

    const handleAddToPlaylist = (playlistId) => {
        const playlist = JSON.parse(localStorage.getItem(playlistId));
        if (playlist && selectedTrack) {
            playlist.items.push(selectedTrack);
            localStorage.setItem(playlistId, JSON.stringify(playlist));
        }
    };

    return (
        <>
            <section className="music-chart">
                <div className="title">
                    <h2>{title}</h2>
                    {showCalendar && (
                        <div className="date">
                            <DatePicker selected={selectedDate} onChange={onDateChange} dateFormat="yyyy-MM-dd" minDate={minDate} maxDate={maxDate} customInput={<CustomInput />} />
                        </div>
                    )}
                </div>
                <div className="list">
                    <ul>
                        {data.map((item, index) => (
                            <li key={index} onClick={() => handleItemClick(item)}>
                                <span className="rank">#{item.rank}</span>
                                <span className="img" style={{ backgroundImage: `url(${item.imageURL})` }}></span>
                                <span className="title">{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
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
                    {chartData && (
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
                    )}
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

export default Chart;
