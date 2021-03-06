import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const getUrl = 'https://www.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=5678f52d2b3c555b0e882454bab71c27&extras=url_n&format=json&nojsoncallback=1&per_page=100'
let searchTimer;
const PhotoData = () => {
    const loader = useRef(null);
    const [searchText, setSearchtext] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [photosData, setPhotosData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalSource, setModalSource] = useState('');
    const [userHistory, setUserHistory] = useState('');

    ///Debounce Method 
    const debounce = function (fn, delay) {

        return function (...args) {
            
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                console.log(delay);
                setIsLoading(true);
                setPhotosData([]);
                fn.apply(this, args);
            }, delay);


        }
    }


    ///Code to check if user is at the end of the page
    const handleObserver = useCallback((entries) => {

        const target = entries[0];
        if (target.isIntersecting) {
            setPageNumber((prev) => prev + 1);
        }
    }, [isLoading]);
    useEffect(() => {
        if (searchText !== '') {
            searchFunction(searchText);
        }
    }, [pageNumber])
    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "20px",
            threshold: 0
        };
        const observer = new IntersectionObserver(handleObserver, option);
        if (loader.current) observer.observe(loader.current);
    }, [handleObserver]);

    ///API call to the get the recent images which are loaded at the initial Load
    const getPhotos = async () => {
        try {
            const response = await axios.get(getUrl);
            setPhotosData(response.data.photos.photo);
            setIsLoading(false);
        }
        catch (err) {
            alert('Something went wrong. Sorry for the inconvenience caused.')
        }
    }

    ///Hook to get call the getPhotos methd at the initial page load
    useEffect(() => {
        getPhotos();
    }, [getUrl]);

    ///method to set the text of the search parameter
    const searchPhotos = async (e) => {

        setSearchtext(e.target.value);

        newSearch(e.target.value);
    }

    ///Method to check if user has pressed enter to display the searched images
    const keyChangeFunction = async (e) => {

        if (e.key === 'Enter') {

            setIsLoading(true);
            clearTimeout(searchTimer);
            if (e.target.value === '') {
                getPhotos();
            }
            else {

                setPhotosData([]);
                searchFunction(searchText);

            }
        }


    }

    ///Method to call the search API and display images
    const searchFunction = async (searchParameter) => {
        
        const maxHistoryLength = 10;
        var history = [];
        history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        var isHistoryMaxed = Object.keys(history).length === maxHistoryLength;
        var workingHistory = isHistoryMaxed ? history.slice(1) : history;
        workingHistory.push(searchParameter);
        var newHistory = workingHistory.filter((ele, index) => workingHistory.indexOf(ele) === index);

        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        let searchAPI = 'https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=5678f52d2b3c555b0e882454bab71c27&extras=url_n&format=json&nojsoncallback=1&per_page=10&page=' + pageNumber + '&tags=' + searchParameter;
        try {
            if (searchText !== '') {
                const response = await axios.get(searchAPI);
                setPhotosData((prev) =>
                    [...prev, ...response.data.photos.photo]
                )
                setIsLoading(false);
            }
        }
        catch (err) {
            console.log('Something went wrong. Sorry for the inconvenience caused.')
        }
    }
    
    
    const newSearch = debounce(searchFunction, 1000);


    ///Display the recent user searches
    const showRecentSearch = async (e) => {
        var history = [];
        history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setUserHistory(history.join(','));
    }


    return (
        <>

            <div className='headingContainer'>

                <h2>WHAT ARE YOU LOOKING FOR?</h2>
                <br />
                <label id='lblHistory' value={userHistory} style={{ lineHeight: '2', fontSize: '1rem' }}>Recent History : {userHistory}</label>
                <br />
                <input type='text' placeholder='Search' value={searchText} onChange={searchPhotos} onKeyPress={keyChangeFunction} onClick={showRecentSearch}></input>


            </div>
            {isLoading ?
                <div className='preloader'>
                    <div className='loader'></div>
                </div>

                :
                <div>
                    <ul className="users">
                        {photosData && photosData.map((photo) => {
                            const { url_n, id } = photo;
                            if (url_n) {
                                return (

                                    <li key={id} >
                                        <img src={url_n} alt={id} onClick={() => { setModalSource(url_n); setShowModal(true) }} />

                                    </li>)
                            }
                        })}
                    </ul>
                    <div ref={loader} />
                </div>
            }

            {showModal ?
                <div id='modal' className='ui-photo-detail' onClick={() => { setShowModal(false) }}>
                    <img className="ui-photo" src={modalSource} />
                </div> :
                <></>}
        </>
    )
}

export default PhotoData;