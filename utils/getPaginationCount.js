const getPaginationCount = (pageNo)=>{

    let toSkip;
    let toFetch = 8;
    
    if(Number(pageNo)===0.5){
        toSkip = 0;
        toFetch = 3;
    }
    else{
        if(Number(pageNo)===1){ toSkip = 0 }
        else{ toSkip = (pageNo-1)*8 }
    }

    return { toSkip, toFetch };
}

module.exports = getPaginationCount;
