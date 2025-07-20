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
                <img src="images/icon-placeholder.jpg" style={{width: "100%", display: "block"}}/>
                <img src="images/cookie.png" style={{width: "100%", display: "block"}}/>
                {/* Children */}
                <img src="images/camera-frame-2.png" style={{width: "100%", display: "block"}}/>
                <img src="images/icon-placeholder.jpg" style={{width: "100%", display: "block"}}/>
                <img src="images/icon-placeholder.jpg" style={{width: "100%", display: "block"}}/>
                <img src="images/icon-placeholder.jpg" style={{width: "100%", display: "block"}}/>
            </Masonry>
        </ResponsiveMasonry>
        </div>
    </div>
  )
}

export default ImageGallery
