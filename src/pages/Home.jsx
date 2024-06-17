import React, { useState, useEffect, useMemo } from 'react';
import ChartSlider from '../components/ChartSlider';
import Loading from '../components/Loading';
import Error from '../components/Error';

const Home = () => {
    const getYesterdaysDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date;
    };

    const [selectedDate] = useState(getYesterdaysDate()); // setSelectedDate 제거
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formattedDate = selectedDate.toISOString().split('T')[0];

    const chartUrls = useMemo(() => [
        { id: 'melon', name: '멜론 차트', url: `https://raw.githubusercontent.com/KIMJW04/music-chart/main/melon/melon100_${formattedDate}.json` },
        { id: 'bugs', name: '벅스 차트', url: `https://raw.githubusercontent.com/KIMJW04/music-chart/main/bugs/bugs100_${formattedDate}.json` },
        { id: 'apple', name: '애플 차트', url: `https://raw.githubusercontent.com/KIMJW04/music-chart/main/apple/apple100_${formattedDate}.json` },
        { id: 'billboard', name: '빌보드 차트', url: `https://raw.githubusercontent.com/KIMJW04/music-chart/main/billboard/billboard100_${formattedDate}.json` }
    ], [formattedDate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.all(chartUrls.map(async (chart) => {
                    const response = await fetch(chart.url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch data from ${chart.name}`);
                    }
                    return {
                        id: chart.id,
                        name: chart.name,
                        data: await response.json()
                    };
                }));
                setCharts(results);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchData();
    }, [chartUrls]);

    if (loading) return <Loading loading={true} />;
    if (error) return <Error message={error.message} />;

    return (
        <div>
            {charts.map((chart, index) => (
                <ChartSlider key={index} charts={chart.data.slice(0, 10)} title={chart.name} />
            ))}
        </div>
    );
};

export default Home;
