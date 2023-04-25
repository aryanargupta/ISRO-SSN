import priority_queue
import geopy
import Graph_builder
import Cost
from priority_queue import PriorityQueue, Priority
from geopy.distance import geodesic
from Graph_builder import Node, GraphBuilder
from Cost import env_factors
from typing import Tuple
from Cost import distances

class Safe_path:
    def __init__ (self,n,d,graph,changednodes=None):
        self.source=n
        ##print(self.source)
        self.destination=d
        self.dist=0
        self.adjlist=graph.adjlist
        self.open=PriorityQueue()
        self.path=[]
        self.k_m=0
        self.changednodes=changednodes
        self.checkpoint=n
        self.graph=graph
        graph.get_node(d).rhs=0
        self.open.insert(graph.get_node(d),self.calculate_key(graph.get_node(d)))
        

        ######one time things end here

    def move_and_replan(self, new_pos: Tuple[int, int]):
        self.path=[new_pos]
        self.source=new_pos
        #print(self.source)
        self.compute_shortest_path()
        while self.source != self.destination:
            assert (self.graph.get_node(self.source).rhs != float('inf')), "There is no known path!"
            
            """
            computes the next best step and moves one step
            """
            if self.changednodes:
                self.k_m += geodesic(self.checkpoint, self.source).km
                self.checkpoint = self.source
                
                for node in self.changednodes:
                    neighbours = self.graph.adjlist[node]
                    neighbours=sorted(list(neighbours),key= lambda x: x.g)

                    #calculated rhs of node and put it on open list
                    for n_node in neighbours:
                        min_s= float('inf')
                        c_new = self.cost(node.coord,n_node.coord,"new")
                        temp=c_new+n_node.g
                        if temp<min_s:
                            min_s=temp
                    node.rhs=min_s
                    self.update_node(node)

                    #updating the neighbours and putting the updated one on the open list
                    for n_node in neighbours:
                        c_old = self.cost(n_node.coord,node.coord) #includes hs
                        c_new = self.cost(n_node.coord,node.coord,"new") #includes hs
                        if c_old > c_new:
                            """
                            checking if node acts as an 
                            better parent node
                            """
                            if n_node.coord != self.destination:
                                n_node.rhs = min(n_node.rhs, c_new + node.g)
                                self.update_node(n_node)#added
                        elif n_node.rhs == c_old + node.g:
                            """
                            as node turned out to be parent node
                            n_node has to recheck its options
                            """
                            if n_node.coord != self.destination:
                                min_s = float('inf')
                                nn_nodes = self.graph.adjlist[n_node]
                                nn_nodes=sorted(list(nn_nodes),key= lambda x: x.g)

                                for nn_node in nn_nodes:
                                    temp = self.cost(n_node.coord,nn_node.coord,"new") + nn_node.g#swapped n_node and nn_node
                                    if min_s > temp:
                                        min_s = temp
                                n_node.rhs = min_s
                            """
                            operations on neighbour node of changed
                            node:push/pop/update
                            """
                            self.update_node(n_node)#edge case error may be
                    """
                    acknowledging the change in
                    the node's parameters.
                    """
                    
                    node.hs[0]=node.hs[1]


                self.changednodes=None
            """
            this call will now consider
            the options available in the
            priority list
            """
            self.compute_shortest_path()
            

            """
            considering the best option
            around the current position
            """
            neighbours = self.graph.adjlist[self.graph.get_node(self.source)]
            min_s = float('inf')
            arg_min = None
            for n in neighbours:
                temp = geodesic(self.source,n.coord).km + n.g + n.hs[0]#changed added hs
                if temp < min_s:
                    min_s = temp
                    arg_min = n
            self.source = arg_min.coord
            self.path.append(self.source)

           


        return self.path

    def calculate_key(self,n:Tuple[int,int]):
        #print("key:",n)

        k1 = min(n.g, n.rhs) + geodesic(self.source, n.coord).km + self.k_m
        k2 = min(n.g, n.rhs)
        return Priority(k1, k2)
    
    def cost(self, a:Tuple[int,int], b:Tuple[int,int], type=""):
        #from b to a
        if(type==""):
            type=0#old
        else:
            type=1#new
        """
        new and old costs are based on the new and old values of parameters.
        """
        """
        this is changing only if either one of them has become into an obstacle.
        """
        if(not self.graph.get_node(a).hs[type]<0 and not self.graph.get_node(b).hs[type]<0):#changed a type to 0
            cost = geodesic(a,b).km+30*self.graph.get_node(b).hs[type]#changed
        else:
            cost = float('inf') 
        
        return cost

        
    def update_node(self, u:Node):
        #present = u in self.open.vertices_in_heap
        if u.g != u.rhs and self.open.get(u):
            self.open.update(u, self.calculate_key(u))
        elif u.g != u.rhs and not self.open.get(u):
            self.open.insert(u, self.calculate_key(u))
        elif u.g == u.rhs and self.open.get(u):
            self.open.remove(u)

    def compute_shortest_path(self):
        #print("##########")
        while self.open.top_key() <= self.calculate_key(self.graph.get_node(self.source)) or self.graph.get_node(self.source).rhs > self.graph.get_node(self.source).g:
            o = self.open.top()
            #print("o:",o)
            k_old = self.open.top_key()
            k_new = self.calculate_key(o)
            ##print(u)
            if k_old < k_new:
                #print("1")#updated node check
                self.open.update(o, k_new)
            elif o.g > o.rhs:
                #print("2")#unblocked
                o.g = o.rhs
                self.open.remove(o)

                neighbours = self.graph.adjlist[o]
                # for i in neighbours:
                #     #print(type(i))
                #update neighbours in AO of g values 
                neighbours=sorted(list(neighbours),key= lambda x: x.g)
                for n in neighbours:
                    if n.coord != self.destination:
                        n.rhs = min(n.rhs, geodesic(n.coord,o.coord).km + o.g + 30*o.hs[0])
                    self.update_node(n)
            else:
                #print("3")#blocked
                self.g_old = o.g
                o.g = float('inf')
                self.update_node(o)
                neighbours = self.graph.adjlist[o]
                #neighbours.add(o) #new comment put up
                #updating predecessors after updating g
                neighbours=sorted(list(neighbours),key= lambda x: x.g)
                for n in neighbours:
                    if n.rhs == geodesic(n.coord,o.coord).km + self.g_old + 30*o.hs[0]:#check new or old
                        if n.coord != self.destination:
                            min_s = float('inf')
                            succ = self.graph.adjlist[n]
                            for s_ in succ:
                                temp = geodesic(n.coord,s_.coord).km + s_.g + 30*s_.hs[0]#check new or old
                                if min_s > temp:
                                    min_s = temp
                            n.rhs = min_s
                            self.update_node(n)
                #     self.update_node(o)


    

##########################
#testing case 1
#needed => source co-ord, dest co-ord, adjacency list
# source = (10,80)
# dest   = (16,70)
# adjlist = GraphBuilder("full",2).graph.graph.adjlist
# #print(type(adjlist))
# #print(adjlist[self.graph.get_node(source)])

# ##print(Safe_path(source, dest, adjlist).path)
# #print("path:")
# ans=Safe_path(source,dest,adjlist)
# for i in ans.path: 
#     #print(i.lat,i.lon)
# #print("frontier")
# #print(ans.path)

##########################
