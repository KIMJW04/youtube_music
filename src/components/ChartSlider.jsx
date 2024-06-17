import React from 'react';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

const ChartSlider = ({ charts, title }) => {
    if (!charts || charts.length === 0) {
        return <p>차트를 불러오는 중입니다...</p>;
    }

    return (
        <section id='slider__wrap'>
            <h2>😜 {title} Top10</h2>
            <Swiper
                modules={[Navigation, Pagination, Scrollbar, A11y]}
                spaceBetween={50}
                slidesPerView={3}
                navigation
                scrollbar={{ draggable: true }}
                onSwiper={(swiper) => console.log(swiper)}
                onSlideChange={() => console.log('slide change')}
            >
                {charts.map((chart, index) => (
                    <SwiperSlide key={index}>
                        <div className="swiper-slide-content">
                            <img src={chart.imageURL} alt={chart.title} />
                            <p>{chart.rank}. {chart.title} - {chart.artist}</p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};

export default ChartSlider;
