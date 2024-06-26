import React from "react";
import useFetchData from "../hook/useFetchData";

import Loading from "../components/Loading";
import Error from "../components/Error";
import Chart from "../components/Chart2";

const Mymusic = () => {
    const { data, loading, error } = useFetchData("/data/kimjw_list.json");

    if (loading) return <Loading loading={loading} />;
    if (error) return <Error message={error.message} />;

    return (
        <section id="myMusic">
            <Chart title="🎵 미엔토의 음악 리스트" data={data} showCalendar={false} />
        </section>
    );
};

export default Mymusic;
