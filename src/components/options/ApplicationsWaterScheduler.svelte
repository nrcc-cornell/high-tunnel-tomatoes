<script>
  function generateWateringEvents(startDate, endDate, interval, amount) {
    // Convert input strings to Date objects
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Ensure startDate is before endDate
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Count number of applications to be added
    let currentDate = new Date(startDate.getTime());
    let numToCreate = 0;
    while (currentDate <= endDate) {
      // Increment counter
      numToCreate++;

      // Increment the date by the specified interval
      currentDate.setDate(currentDate.getDate() + interval);
    }

    // Make sure user understands the implications of this action
    if (confirm(`This action will create ${numToCreate} new application events. Continue?`)) {
      const newApplications = [];

      // Loop through the date range with the specified interval
      currentDate = startDate;
      while (currentDate <= endDate) {
        // Create an object with the amount, date, and id, as well as empty arrays for all nitrogen
        const newApplication = {
          date: currentDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
          waterAmount: amount,
          fastN: [],
          mediumN: [],
          slowN: [],
          inorganicN: 0,
          id: new Date().getTime()
        };

        // Add the object to the array
        newApplications.push(newApplication);

        // Increment the date by the specified interval
        currentDate.setDate(currentDate.getDate() + interval);
      }
    
      return newApplications;
    }
  }
</script>