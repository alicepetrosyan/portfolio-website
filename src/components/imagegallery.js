import "./imagegallery.css"
import React from 'react'
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

function ImageGallery() {
  return (
    <div className="masonry-background">
        <div className='masonry-container'>
        <ResponsiveMasonry
            columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}
            gutterBreakpoints={{350: "12px", 750: "16px", 900: "24px"}}
        >
            <Masonry>
                <div className='masonry-img'> <img src="images/2.png" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/7.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/4.png" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/8.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/3.png" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/5.png" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/6.png" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/9.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/10.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/11.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/12.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/13.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/14.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/15.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/16.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/17.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/18.jpg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/19.jpeg" style={{width: "100%", display: "block"}}/> </div>
                <div className='masonry-img'> <img src="images/20.png" style={{width: "100%", display: "block"}}/> </div>
            </Masonry>
        </ResponsiveMasonry>
        </div>
    </div>
  )
}

export default ImageGallery
