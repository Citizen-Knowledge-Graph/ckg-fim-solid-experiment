# Citizen Knowledge Graph

### CONTEXT
My domain is the German landscape of state benefits and funding for citizens - e.g. child allowance or funding support for solar panels.

### NEED
A large number of individuals and families don’t receive benefits they would be eligible for, either because they don’t know about it or because they perceive the application as too complicated.

### TASK
The goal to implement an automatic matching (and ideally even automatic payouts) between offers from the state and eligible recipients falls into the area of proactive governments. However, especially Germany has a long road ahead to realize this to due strong sensibilities about data privacy and a reluctance towards the idea of the state knowing everything about you. 

### SOLUTION
Our solution is to enable citizens to build up their own data profile as RDF graph in a Solid pod following the same standardized data fields that are also being used in the administration. Then they download a lot of requirement profiles, each of which is a SHACL file defining the constraints one has to fulfill to be eligible for a benefit. These are run against the data profile of the citizen and results in a report saying: "You are eligible for X benefits, not eligible for Y and for Z I am missing necessary data points".

### CONCLUSION / PERSPECTIVE
We believe this approach could bring a lot of value to individuals and families who might first hear about opportunities for them that they didn’t know about. Furthermore, our hope is that it brings positive effects towards how “close” we feel towards the state and the democracy we live in. By using interoperable semantic technologies, we hope to contribute to the advancement of the linked data field as a whole and to increate the credibility of our focus on the common good by basically defining our app only as a convenience layer, everything would still work without it by just using existing open source tools.
