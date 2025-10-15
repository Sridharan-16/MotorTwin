exports.validator = (current,voltage,temperature)=>{
    return typeof(current)=== 'number'&& typeof(voltage)==='number' && typeof(temperature)==='number';
};