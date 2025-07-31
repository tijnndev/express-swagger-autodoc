function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function lowercaseFirstLetter(val) {
    return String(val).charAt(0).toLowerCase() + String(val).slice(1);
}

module.exports = {
    capitalizeFirstLetter,
    lowercaseFirstLetter
};